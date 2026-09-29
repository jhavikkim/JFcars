import { json, requestUser } from '@/lib/site-db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await requestUser(request);
    return json({
      authenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      user: user ? { name: user.name, email: user.email } : null,
    });
  } catch {
    return json({ error: 'Session service unavailable' }, { status: 503 });
  }
}
