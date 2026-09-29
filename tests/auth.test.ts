import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearAuthCookie,
  hashOpaqueToken,
  hashPassword,
  normalizeAuthEmail,
  passwordIterations,
  sessionCookieName,
  verifyPassword,
} from '../lib/auth';

void test('auth email normalization is strict and case-insensitive', () => {
  assert.equal(normalizeAuthEmail(' Owner@Example.COM '), 'owner@example.com');
  assert.equal(normalizeAuthEmail('owner@example.com?next=bad'), '');
  assert.equal(normalizeAuthEmail('not-an-email'), '');
});

void test('password records are salted and verify without storing plaintext', async () => {
  const first = await hashPassword('A strong test password');
  const second = await hashPassword('A strong test password');
  assert.equal(first.iterations, passwordIterations);
  assert.notEqual(first.salt, second.salt);
  assert.notEqual(first.hash, second.hash);
  assert.equal(
    await verifyPassword(
      'A strong test password',
      first.salt,
      first.hash,
      first.iterations,
    ),
    true,
  );
  assert.equal(
    await verifyPassword(
      'The wrong password',
      first.salt,
      first.hash,
      first.iterations,
    ),
    false,
  );
});

void test('opaque verification tokens are stored as stable digests', async () => {
  const token = 'an-example-verification-token-that-is-never-stored';
  const digest = await hashOpaqueToken(token);
  assert.equal(digest, await hashOpaqueToken(token));
  assert.notEqual(digest, token);
  assert.match(digest, /^[a-f0-9]{64}$/);
});

void test('session deletion cookie is host-scoped, HttpOnly and HTTPS-aware', () => {
  const secure = clearAuthCookie(
    new Request('https://jfcars.4rbl.com/api/auth'),
  );
  assert.match(secure, new RegExp(`^${sessionCookieName}=`));
  assert.match(secure, /Path=\//);
  assert.match(secure, /HttpOnly/);
  assert.match(secure, /SameSite=Lax/);
  assert.match(secure, /Max-Age=0/);
  assert.match(secure, /Secure/);

  const local = clearAuthCookie(new Request('http://127.0.0.1:3010/api/auth'));
  assert.doesNotMatch(local, /Secure/);
});
