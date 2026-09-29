import assert from 'node:assert/strict';
import test from 'node:test';

import { limitRequestBody, readJsonObject } from '../lib/request-body';

function streamedRequest(chunks: string[], contentLength?: string) {
  const headers = new Headers();
  if (contentLength !== undefined) headers.set('content-length', contentLength);
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Request('https://example.com/api/media', {
    method: 'POST',
    headers,
    body,
    duplex: 'half',
  } as RequestInit & { duplex: 'half' });
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

void test('streaming limiter preserves chunks without buffering the body', async () => {
  const limited = limitRequestBody(streamedRequest(['abc', 'def'], '6'), 6);
  assert.equal(limited.ok, true);
  if (!limited.ok) return;

  assert.equal(limited.byteLength(), 0);
  assert.equal(await new Response(limited.stream).text(), 'abcdef');
  assert.equal(limited.byteLength(), 6);
  assert.equal(limited.declaredLength, 6);
  assert.equal(limited.limitExceeded(), false);
});

void test('streaming limiter rejects declared oversized bodies before consumption', () => {
  assert.deepEqual(limitRequestBody(streamedRequest(['body'], '101'), 100), {
    ok: false,
    error: 'Request is too large',
    status: 413,
  });
});

void test('streaming limiter rejects invalid Content-Length', () => {
  assert.deepEqual(limitRequestBody(streamedRequest(['body'], '-1'), 100), {
    ok: false,
    error: 'Invalid request body',
    status: 400,
  });
});

for (const scenario of [
  { name: 'without Content-Length', length: undefined },
  { name: 'with a forged low Content-Length', length: '1' },
]) {
  void test(`streaming limiter enforces actual bytes ${scenario.name}`, async () => {
    const limited = limitRequestBody(
      streamedRequest(['1234', '5678'], scenario.length),
      7,
    );
    assert.equal(limited.ok, true);
    if (!limited.ok) return;

    await assert.rejects(new Response(limited.stream).arrayBuffer());
    assert.equal(limited.byteLength(), 8);
    assert.equal(limited.limitExceeded(), true);
  });
}
