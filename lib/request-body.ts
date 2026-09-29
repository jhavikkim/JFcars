type RequestBodyError = {
  ok: false;
  error: 'Invalid request body' | 'Request is too large';
  status: 400 | 413;
};

export type RequestBodyResult =
  | {
      ok: true;
      bytes: Uint8Array<ArrayBuffer>;
      byteLength: number;
    }
  | RequestBodyError;

export type JsonObjectResult =
  | {
      ok: true;
      value: Record<string, unknown>;
      byteLength: number;
    }
  | RequestBodyError;

export type LimitedRequestBodyResult =
  | {
      ok: true;
      stream: ReadableStream<Uint8Array<ArrayBuffer>>;
      byteLength: () => number;
      declaredLength: number | null;
      limitExceeded: () => boolean;
    }
  | RequestBodyError;

/**
 * Wraps the request stream with an actual byte counter.
 * Content-Length is only an early rejection hint: clients may omit or forge it.
 */
export function limitRequestBody(
  request: Request,
  maximumBytes: number,
): LimitedRequestBodyResult {
  const declaredValue = request.headers.get('content-length');
  let declaredLength: number | null = null;
  if (declaredValue !== null) {
    if (!/^\d+$/.test(declaredValue))
      return { ok: false, error: 'Invalid request body', status: 400 };
    declaredLength = Number(declaredValue);
    if (!Number.isSafeInteger(declaredLength))
      return { ok: false, error: 'Invalid request body', status: 400 };
    if (declaredLength > maximumBytes)
      return { ok: false, error: 'Request is too large', status: 413 };
  }

  if (!request.body)
    return { ok: false, error: 'Invalid request body', status: 400 };

  let byteLength = 0;
  let exceeded = false;
  const reader = request.body.getReader();
  let stream: ReadableStream<Uint8Array<ArrayBuffer>>;
  try {
    stream = new ReadableStream<Uint8Array<ArrayBuffer>>({
      async pull(controller) {
        try {
          const next = await reader.read();
          if (next.done) {
            controller.close();
            return;
          }
          byteLength += next.value.byteLength;
          if (byteLength > maximumBytes) {
            exceeded = true;
            await reader.cancel('Request body limit exceeded');
            controller.error(new Error('Request body limit exceeded'));
            return;
          }
          controller.enqueue(next.value);
        } catch (error) {
          controller.error(error);
        }
      },
      async cancel(reason) {
        await reader.cancel(reason);
      },
    });
  } catch {
    void reader.cancel('Invalid request body');
    return { ok: false, error: 'Invalid request body', status: 400 };
  }

  return {
    ok: true,
    stream,
    byteLength: () => byteLength,
    declaredLength,
    limitExceeded: () => exceeded,
  };
}

/** Buffers a request after bounding its streamed bytes. */
export async function readRequestBody(
  request: Request,
  maximumBytes: number,
): Promise<RequestBodyResult> {
  const limited = limitRequestBody(request, maximumBytes);
  if (!limited.ok) return limited;

  try {
    const bytes = new Uint8Array(
      await new Response(limited.stream).arrayBuffer(),
    );
    return { ok: true, bytes, byteLength: limited.byteLength() };
  } catch {
    return limited.limitExceeded()
      ? { ok: false, error: 'Request is too large', status: 413 }
      : { ok: false, error: 'Invalid request body', status: 400 };
  }
}

/** Reads a JSON object after bounding the complete request body. */
export async function readJsonObject(
  request: Request,
  maximumBytes: number,
): Promise<JsonObjectResult> {
  const body = await readRequestBody(request, maximumBytes);
  if (!body.ok) return body;

  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(body.bytes);
    const value = JSON.parse(text) as unknown;
    if (!value || typeof value !== 'object' || Array.isArray(value))
      return { ok: false, error: 'Invalid request body', status: 400 };
    return {
      ok: true,
      value: value as Record<string, unknown>,
      byteLength: body.byteLength,
    };
  } catch {
    return { ok: false, error: 'Invalid request body', status: 400 };
  }
}
