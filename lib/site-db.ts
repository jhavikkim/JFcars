import { env } from 'cloudflare:workers';
import {
  accountStateSchema,
  marketplaceStateSchema,
  ordersSchema,
  ordersUserIndexSchema,
  partRequestsSchema,
  partRequestsUserIndexSchema,
  requestLimitsSchema,
  sellerInquiriesSchema,
  sellRequestsSchema,
} from '@/db/schema';

type RuntimeEnv = {
  DB?: D1Database;
  JFCARS_ADMIN_USER_IDS?: string;
};

export function database() {
  const db = (env as unknown as RuntimeEnv).DB;
  if (!db) throw new Error('JFcars database binding is unavailable');
  return db;
}

export async function ensureDatabase() {
  const db = database();
  await db.batch([
    db.prepare(marketplaceStateSchema),
    db.prepare(accountStateSchema),
    db.prepare(ordersSchema),
    db.prepare(ordersUserIndexSchema),
    db.prepare(partRequestsSchema),
    db.prepare(partRequestsUserIndexSchema),
    db.prepare(requestLimitsSchema),
    db.prepare(sellerInquiriesSchema),
    db.prepare(sellRequestsSchema),
  ]);
  return db;
}

export function requestUser(request: Request) {
  const id = request.headers.get('oai-authenticated-user-id')?.trim() || '';
  const email =
    request.headers.get('oai-authenticated-user-email')?.trim() || '';
  const encodedName = request.headers.get('oai-authenticated-user-full-name');
  const encoding = request.headers.get(
    'oai-authenticated-user-full-name-encoding',
  );
  let name = '';
  if (encodedName && encoding === 'percent-encoded-utf-8') {
    try {
      name = decodeURIComponent(encodedName);
    } catch {
      name = '';
    }
  }
  return id && email ? { id, email, name: name || email.split('@')[0] } : null;
}

export function isAdminRequest(request: Request) {
  if (process.env.NODE_ENV === 'development') return true;
  const user = requestUser(request);
  if (!user) return false;
  const allowed = String(
    (env as unknown as RuntimeEnv).JFCARS_ADMIN_USER_IDS || '',
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return allowed.includes(user.id);
}

export function json(value: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('cache-control', 'no-store');
  return Response.json(value, {
    ...init,
    headers,
  });
}

export function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
