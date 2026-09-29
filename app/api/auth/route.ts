import {
  createAuthSession,
  createEmailVerificationToken,
  destroyAuthSession,
  hashPassword,
  normalizeAuthEmail,
  verifyPassword,
} from '@/lib/auth';
import { sendVerificationEmail, type EmailLanguage } from '@/lib/email';
import { ensureDatabase, json } from '@/lib/site-db';
import { readJsonObject } from '@/lib/request-body';

export const dynamic = 'force-dynamic';

const encoder = new TextEncoder();

function safeName(value: unknown) {
  return Array.from(typeof value === 'string' ? value : '')
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 100);
}

function requestIp(request: Request) {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

async function digest(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(bytes))
    .slice(0, 16)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function rateLimited(
  db: D1Database,
  request: Request,
  action: string,
  identity: string,
  limit: number,
) {
  const key = `auth:${action}:${await digest(`${requestIp(request)}:${identity}`)}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % 3600);
  await db
    .prepare(
      `INSERT INTO request_limits (key, window_start, count) VALUES (?, ?, 1)
       ON CONFLICT(key) DO UPDATE SET
       window_start = CASE WHEN window_start = excluded.window_start
                           THEN window_start ELSE excluded.window_start END,
       count = CASE WHEN window_start = excluded.window_start
                    THEN count + 1 ELSE 1 END`,
    )
    .bind(key, windowStart)
    .run();
  const row = await db
    .prepare(`SELECT count FROM request_limits WHERE key = ?`)
    .bind(key)
    .first<{ count: number }>();
  return Number(row?.count || 0) > limit;
}

function sameOrigin(request: Request) {
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'cross-site') return false;
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    const expectedHost =
      request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
      request.headers.get('host') ||
      new URL(request.url).host;
    return new URL(origin).host === expectedHost;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request))
    return json({ error: 'Request origin is not allowed' }, { status: 403 });
  const parsed = await readJsonObject(request, 20_000);
  if (!parsed.ok)
    return json({ error: parsed.error }, { status: parsed.status });
  const body = parsed.value;
  const action = typeof body.action === 'string' ? body.action : '';

  try {
    const db = await ensureDatabase();
    if (action === 'signout') {
      const cookie = await destroyAuthSession(db, request);
      return json(
        { ok: true },
        { headers: { 'set-cookie': cookie }, status: 200 },
      );
    }

    if (
      action !== 'signin' &&
      action !== 'signup' &&
      action !== 'resend-verification'
    )
      return json({ error: 'Unknown authentication action' }, { status: 400 });

    const email = normalizeAuthEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || password.length < 10 || password.length > 128)
      return json(
        { error: 'Enter a valid email and a password of 10–128 characters.' },
        { status: 400 },
      );
    const limit = action === 'signin' ? 20 : 5;
    if (await rateLimited(db, request, action, email, limit))
      return json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 },
      );

    if (action === 'signup') {
      const name = safeName(body.name);
      const language = (
        body.language === 'fr' ||
        body.language === 'es' ||
        body.language === 'pt'
          ? body.language
          : 'en'
      ) as EmailLanguage;
      if (name.length < 2)
        return json({ error: 'Enter your full name.' }, { status: 400 });
      const existing = await db
        .prepare(`SELECT id FROM auth_users WHERE email = ?`)
        .bind(email)
        .first<{ id: string }>();
      if (existing)
        return json(
          { error: 'An account already exists for this email.' },
          { status: 409 },
        );
      const userId = crypto.randomUUID();
      const passwordRecord = await hashPassword(password);
      await db.batch([
        db
          .prepare(
            `INSERT INTO auth_users
             (id, email, name, password_hash, password_salt,
              password_iterations, role, disabled, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, 'user', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          )
          .bind(
            userId,
            email,
            name,
            passwordRecord.hash,
            passwordRecord.salt,
            passwordRecord.iterations,
          ),
        db
          .prepare(
            `INSERT INTO user_profiles
             (user_id, name, preferred_currency, updated_at)
             VALUES (?, ?, 'XAF', CURRENT_TIMESTAMP)`,
          )
          .bind(userId, name),
      ]);
      const token = await createEmailVerificationToken(db, userId);
      try {
        await sendVerificationEmail({ to: email, name, token, language });
      } catch (error) {
        await db.batch([
          db
            .prepare(`DELETE FROM email_verification_tokens WHERE user_id = ?`)
            .bind(userId),
          db
            .prepare(`DELETE FROM user_profiles WHERE user_id = ?`)
            .bind(userId),
          db.prepare(`DELETE FROM auth_users WHERE id = ?`).bind(userId),
        ]);
        throw error;
      }
      return json(
        { ok: true, verificationRequired: true },
        { status: 201 },
      );
    }

    const user = await db
      .prepare(
        `SELECT id, email, name, password_hash, password_salt,
                password_iterations, role, disabled, email_verified_at
         FROM auth_users WHERE email = ?`,
      )
      .bind(email)
      .first<{
        id: string;
        email: string;
        name: string;
        password_hash: string;
        password_salt: string;
        password_iterations: number;
        role: 'user' | 'admin';
        disabled: number;
        email_verified_at: string | null;
      }>();
    let valid = false;
    if (user)
      valid = await verifyPassword(
        password,
        user.password_salt,
        user.password_hash,
        user.password_iterations,
      );
    else await hashPassword(password);
    if (!user || !valid || user.disabled)
      return json(
        { error: 'Email or password is incorrect.' },
        { status: 401 },
      );
    if (!user.email_verified_at) {
      if (action === 'resend-verification') {
        const language = (
          body.language === 'fr' ||
          body.language === 'es' ||
          body.language === 'pt'
            ? body.language
            : 'en'
        ) as EmailLanguage;
        const token = await createEmailVerificationToken(db, user.id);
        await sendVerificationEmail({
          to: user.email,
          name: user.name,
          token,
          language,
        });
        return json({ ok: true, verificationRequired: true }, { status: 200 });
      }
      return json(
        {
          error: 'Verify your email before signing in.',
          code: 'email_unverified',
        },
        { status: 403 },
      );
    }
    if (action === 'resend-verification')
      return json({ ok: true, alreadyVerified: true }, { status: 200 });
    await db
      .prepare(
        `UPDATE auth_users
         SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
      )
      .bind(user.id)
      .run();
    const cookie = await createAuthSession(db, request, user.id);
    return json(
      {
        ok: true,
        user: { name: user.name, email: user.email, role: user.role },
      },
      { headers: { 'set-cookie': cookie }, status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (action === 'signup' && /unique|constraint/i.test(message))
      return json(
        { error: 'An account already exists for this email.' },
        { status: 409 },
      );
    console.error('JFcars authentication operation failed', error);
    return json(
      { error: 'Authentication service unavailable' },
      { status: 503 },
    );
  }
}
