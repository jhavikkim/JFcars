import { isAdminRequest, json, requestUser } from '@/lib/site-db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'development') {
    return json({
      authenticated: true,
      isAdmin: true,
      user: { name: 'Local Admin', email: 'admin@jfcars.local' },
    });
  }
  const user = requestUser(request);
  return json({
    authenticated: Boolean(user),
    isAdmin: isAdminRequest(request),
    user: user ? { name: user.name, email: user.email } : null,
  });
}
