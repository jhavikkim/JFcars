import { env } from 'cloudflare:workers';
import { authenticatedUserFromRequest } from '@/lib/auth';

type RuntimeEnv = {
  DB?: D1Database;
};

export function database() {
  const db = (env as unknown as RuntimeEnv).DB;
  if (!db) throw new Error('JFcars database binding is unavailable');
  return db;
}

export async function ensureDatabase() {
  return database();
}

export async function requestUser(request: Request) {
  return authenticatedUserFromRequest(database(), request);
}

export async function isAdminRequest(request: Request) {
  return (await requestUser(request))?.role === 'admin';
}

export function json(value: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('cache-control', 'no-store');
  return Response.json(value, {
    ...init,
    headers,
  });
}
