import assert from 'node:assert/strict';
import test from 'node:test';

import { readFormData, readJsonObject } from '../lib/request-body';

const multipartBody = [
  '--test-boundary',
  'Content-Disposition: form-data; name="purpose"',
  '',
  'gallery',
  '--test-boundary--',
  '',
].join('\r\n');

function multipartRequest(contentLength?: string) {
  const headers = new Headers({
    'content-type': 'multipart/form-data; boundary=test-boundary',
  });
  if (contentLength) headers.set('content-length', contentLength);
  return new Request('https://example.com/api/media', {
    method: 'POST',
    headers,
    body: multipartBody,
  });
}

void test('JSON body reader accepts objects and reports actual bytes', async () => {
  const source = JSON.stringify({ action: 'part-request', value: 'é' });
  const result = await readJsonObject(
    new Request('https://example.com/api', { method: 'POST', body: source }),
    1_000,
  );
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.value, { action: 'part-request', value: 'é' });
    assert.equal(
      result.byteLength,
      new TextEncoder().encode(source).byteLength,
    );
  }
});

void test('JSON body reader enforces the real stream size without Content-Length', async () => {
  const request = new Request('https://example.com/api', {
    method: 'POST',
    body: JSON.stringify({ value: 'x'.repeat(100) }),
  });
  assert.equal(request.headers.has('content-length'), false);
  assert.deepEqual(await readJsonObject(request, 32), {
    ok: false,
    error: 'Request is too large',
    status: 413,
  });
});

void test('JSON body reader rejects non-object JSON', async () => {
  const result = await readJsonObject(
    new Request('https://example.com/api', { method: 'POST', body: '[]' }),
    1_000,
  );
  assert.deepEqual(result, {
    ok: false,
    error: 'Invalid request body',
    status: 400,
  });
});

void test('form-data reader parses a body within the streamed byte limit', async () => {
  const result = await readFormData(multipartRequest(), 1_000);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.get('purpose'), 'gallery');
    assert.equal(
      result.byteLength,
      new TextEncoder().encode(multipartBody).byteLength,
    );
  }
});

void test('form-data reader rejects oversized streamed bytes without Content-Length', async () => {
  const request = multipartRequest();
  assert.equal(request.headers.has('content-length'), false);
  assert.deepEqual(await readFormData(request, 16), {
    ok: false,
    error: 'Request is too large',
    status: 413,
  });
});

void test('form-data reader rejects oversized streamed bytes with a forged Content-Length', async () => {
  assert.deepEqual(await readFormData(multipartRequest('1'), 16), {
    ok: false,
    error: 'Request is too large',
    status: 413,
  });
});
