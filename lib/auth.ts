import { isValidEmailAddress } from '@/lib/contact';

export type AuthRole = 'user' | 'admin';

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
};

export const sessionCookieName = 'jfcars_session';
export const passwordIterations = 310_000;
const sessionLifetimeSeconds = 60 * 60 * 24 * 30;

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function normalizeAuthEmail(value: unknown) {
  const email = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return isValidEmailAddress(email) ? email : '';
}

export async function hashPassword(password: string, suppliedSalt?: string) {
  const salt = suppliedSalt
    ? fromBase64Url(suppliedSalt)
    : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: passwordIterations,
    },
    key,
    256,
  );
  return {
    hash: toBase64Url(new Uint8Array(bits)),
    salt: toBase64Url(salt),
    iterations: passwordIterations,
  };
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
  iterations: number,
) {
  if (iterations < 100_000 || iterations > 1_000_000) return false;
  let saltBytes: Uint8Array<ArrayBuffer>;
  let expectedBytes: Uint8Array<ArrayBuffer>;
  try {
    saltBytes = fromBase64Url(salt);
    expectedBytes = fromBase64Url(expectedHash);
  } catch {
    return false;
  }
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const actual = new Uint8Array(
    await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt: saltBytes,
        iterations,
      },
      key,
      expectedBytes.byteLength * 8,
    ),
  );
  if (actual.byteLength !== expectedBytes.byteLength) return false;
  let difference = 0;
  for (let index = 0; index < actual.byteLength; index += 1)
    difference |= actual[index] ^ expectedBytes[index];
  return difference === 0;
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function cookies(request: Request) {
  const values = new Map<string, string>();
  for (const segment of (request.headers.get('cookie') || '').split(';')) {
    const separator = segment.indexOf('=');
    if (separator < 1) continue;
    const name = segment.slice(0, separator).trim();
    const value = segment.slice(separator + 1).trim();
    if (name) values.set(name, value);
  }
  return values;
}

function isSecureRequest(request: Request) {
  const forwarded = request.headers
    .get('x-forwarded-proto')
    ?.split(',')[0]
    ?.trim()
    .toLowerCase();
  return forwarded === 'https' || new URL(request.url).protocol === 'https:';
}

function sessionCookie(request: Request, value: string, maxAge: number) {
  return [
    `${sessionCookieName}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
    isSecureRequest(request) ? 'Secure' : '',
  ]
    .filter(Boolean)
    .join('; ');
}

export function clearAuthCookie(request: Request) {
  return sessionCookie(request, '', 0);
}

export async function authenticatedUserFromRequest(
  db: D1Database,
  request: Request,
) {
  const token = cookies(request).get(sessionCookieName);
  if (!token || token.length < 32 || token.length > 200) return null;
  const tokenHash = await sha256Hex(token);
  const now = Math.floor(Date.now() / 1000);
  const row = await db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role
       FROM auth_sessions s
       JOIN auth_users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ? AND u.disabled = 0`,
    )
    .bind(tokenHash, now)
    .first<{ id: string; email: string; name: string; role: string }>();
  if (!row || (row.role !== 'user' && row.role !== 'admin')) return null;
  return { ...row, role: row.role as AuthRole } satisfies AuthenticatedUser;
}

export async function createAuthSession(
  db: D1Database,
  request: Request,
  userId: string,
) {
  const token = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await sha256Hex(token);
  const now = Math.floor(Date.now() / 1000);
  await db.batch([
    db.prepare(`DELETE FROM auth_sessions WHERE expires_at <= ?`).bind(now),
    db
      .prepare(
        `INSERT INTO auth_sessions (token_hash, user_id, expires_at)
         VALUES (?, ?, ?)`,
      )
      .bind(tokenHash, userId, now + sessionLifetimeSeconds),
  ]);
  return sessionCookie(request, token, sessionLifetimeSeconds);
}

export async function destroyAuthSession(db: D1Database, request: Request) {
  const token = cookies(request).get(sessionCookieName);
  if (token && token.length >= 32 && token.length <= 200) {
    const tokenHash = await sha256Hex(token);
    await db
      .prepare(`DELETE FROM auth_sessions WHERE token_hash = ?`)
      .bind(tokenHash)
      .run();
  }
  return clearAuthCookie(request);
}
