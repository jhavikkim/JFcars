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

export type FormDataResult =
  | {
      ok: true;
      value: FormData;
      byteLength: number;
    }
  | RequestBodyError;

type LimitedRequestBodyResult =
  | {
      ok: true;
      stream: ReadableStream<Uint8Array<ArrayBuffer>>;
      byteLength: () => number;
      limitExceeded: () => boolean;
    }
  | RequestBodyError;

/**
 * Wraps the request stream with an actual byte counter.
 * Content-Length is only an early rejection hint: clients may omit or forge it.
 */
function limitRequestBody(
  request: Request,
  maximumBytes: number,
): LimitedRequestBodyResult {
  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes)
    return { ok: false, error: 'Request is too large', status: 413 };

  if (!request.body)
    return { ok: false, error: 'Invalid request body', status: 400 };

  let byteLength = 0;
  let exceeded = false;
  let stream: ReadableStream<Uint8Array<ArrayBuffer>>;
  try {
    stream = request.body.pipeThrough(
      new TransformStream<Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>>({
        transform(chunk, controller) {
          byteLength += chunk.byteLength;
          if (byteLength > maximumBytes) {
            exceeded = true;
            throw new Error('Request body limit exceeded');
          }
          controller.enqueue(chunk);
        },
      }),
    );
  } catch {
    return { ok: false, error: 'Invalid request body', status: 400 };
  }

  return {
    ok: true,
    stream,
    byteLength: () => byteLength,
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

/** Reads multipart form data after bounding the complete request body. */
export async function readFormData(
  request: Request,
  maximumBytes: number,
): Promise<FormDataResult> {
  const limited = limitRequestBody(request, maximumBytes);
  if (!limited.ok) return limited;

  const contentType = request.headers.get('content-type');
  if (!contentType)
    return { ok: false, error: 'Invalid request body', status: 400 };

  try {
    const value = await new Response(limited.stream, {
      headers: { 'content-type': contentType },
    }).formData();
    return { ok: true, value, byteLength: limited.byteLength() };
  } catch {
    return limited.limitExceeded()
      ? { ok: false, error: 'Request is too large', status: 413 }
      : { ok: false, error: 'Invalid request body', status: 400 };
  }
}
