import { hashOpaqueToken } from '@/lib/auth';
import { publicSiteUrl } from '@/lib/email';
import { ensureDatabase } from '@/lib/site-db';

export const dynamic = 'force-dynamic';

function redirect(status: 'success' | 'invalid', language = 'en') {
  const target = new URL(publicSiteUrl());
  target.searchParams.set('emailVerified', status);
  if (language === 'fr' || language === 'es' || language === 'pt')
    target.searchParams.set('lang', language);
  return Response.redirect(target, 303);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const token = requestUrl.searchParams.get('token') || '';
  const language = requestUrl.searchParams.get('lang') || 'en';
  if (token.length < 32 || token.length > 200)
    return redirect('invalid', language);
  try {
    const db = await ensureDatabase();
    const tokenHash = await hashOpaqueToken(token);
    const now = Math.floor(Date.now() / 1000);
    const record = await db
      .prepare(
        `SELECT t.user_id FROM email_verification_tokens t
         JOIN auth_users u ON u.id = t.user_id
         WHERE t.token_hash = ? AND t.expires_at > ? AND u.disabled = 0`,
      )
      .bind(tokenHash, now)
      .first<{ user_id: string }>();
    if (!record) return redirect('invalid', language);
    await db.batch([
      db
        .prepare(
          `UPDATE auth_users
           SET email_verified_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND disabled = 0`,
        )
        .bind(record.user_id),
      db
        .prepare(`DELETE FROM email_verification_tokens WHERE user_id = ?`)
        .bind(record.user_id),
    ]);
    return redirect('success', language);
  } catch (error) {
    console.error('JFcars email verification failed', error);
    return redirect('invalid', language);
  }
}
