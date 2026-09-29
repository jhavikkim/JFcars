import { env } from 'cloudflare:workers';
import { parseByteRange } from '@/lib/http-range';
import { limitRequestBody } from '@/lib/request-body';
import { isAdminRequest, json, requestUser } from '@/lib/site-db';

type RuntimeEnv = {
  MEDIA?: R2Bucket;
};

const mediaTypes = {
  'image/jpeg': { extension: 'jpg', maximum: 20 * 1024 * 1024 },
  'image/png': { extension: 'png', maximum: 20 * 1024 * 1024 },
  'image/webp': { extension: 'webp', maximum: 20 * 1024 * 1024 },
  'image/avif': { extension: 'avif', maximum: 20 * 1024 * 1024 },
  // Keep the request below Cloudflare's common 100 MB request ceiling while
  // allowing a useful, web-optimized hero video.
  'video/mp4': { extension: 'mp4', maximum: 95 * 1024 * 1024 },
  'video/webm': { extension: 'webm', maximum: 95 * 1024 * 1024 },
} as const;

type MediaType = keyof typeof mediaTypes;
type MediaPurpose = 'gallery' | 'hero' | 'hero-image' | 'vehicle';

function bucket() {
  const media = (env as unknown as RuntimeEnv).MEDIA;
  if (!media) throw new Error('JFcars media binding is unavailable');
  return media;
}

function safeKey(value: string | null) {
  if (!value || value.length > 220) return '';
  if (!value.startsWith('storefront/')) return '';
  return /^[a-z0-9/_-]+\.[a-z0-9]+$/i.test(value) ? value : '';
}

function matchesSignature(bytes: Uint8Array, type: MediaType) {
  const text = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end));
  if (type === 'image/jpeg')
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === 'image/png')
    return (
      bytes[0] === 0x89 &&
      text(1, 4) === 'PNG' &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  if (type === 'image/webp')
    return text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP';
  if (type === 'image/avif')
    return text(4, 8) === 'ftyp' && ['avif', 'avis'].includes(text(8, 12));
  if (type === 'video/mp4')
    return text(4, 8) === 'ftyp' && !['avif', 'avis'].includes(text(8, 12));
  return (
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  );
}

function requestedPurpose(request: Request): MediaPurpose | null {
  const headerPurpose = request.headers.get('x-upload-purpose')?.trim();
  const queryPurpose = new URL(request.url).searchParams.get('purpose')?.trim();
  if (headerPurpose && queryPurpose && headerPurpose !== queryPurpose)
    return null;
  const value = headerPurpose || queryPurpose;
  return value === 'gallery' ||
    value === 'hero' ||
    value === 'hero-image' ||
    value === 'vehicle'
    ? value
    : null;
}

function requestedName(request: Request) {
  const encoded = request.headers.get('x-upload-name');
  if (!encoded || encoded.length > 720) return '';
  try {
    const value = decodeURIComponent(encoded).normalize('NFKC').trim();
    if (!value || value === '.' || value === '..' || value.length > 180)
      return '';
    for (const character of value) {
      const code = character.charCodeAt(0);
      if (
        code < 0x20 ||
        code === 0x7f ||
        character === '/' ||
        character === '\\'
      )
        return '';
    }
    return value;
  } catch {
    return '';
  }
}

/**
 * Peeks only at the first bytes needed for signature validation, then replays
 * those chunks into a backpressure-aware stream. The complete file is never
 * buffered in the Worker.
 */
async function validateMediaStream(
  stream: ReadableStream<Uint8Array<ArrayBuffer>>,
  type: MediaType,
) {
  const reader = stream.getReader();
  const prefix = new Uint8Array(16);
  const replay: Uint8Array<ArrayBuffer>[] = [];
  let prefixLength = 0;

  try {
    while (prefixLength < prefix.byteLength) {
      const next = await reader.read();
      if (next.done) break;
      if (!next.value.byteLength) continue;
      replay.push(next.value);
      const copied = Math.min(
        next.value.byteLength,
        prefix.byteLength - prefixLength,
      );
      prefix.set(next.value.subarray(0, copied), prefixLength);
      prefixLength += copied;
    }

    if (prefixLength < prefix.byteLength || !matchesSignature(prefix, type)) {
      await reader.cancel('Invalid media signature');
      return null;
    }

    return new ReadableStream<Uint8Array<ArrayBuffer>>({
      start(controller) {
        for (const chunk of replay) controller.enqueue(chunk);
      },
      async pull(controller) {
        try {
          const next = await reader.read();
          if (next.done) controller.close();
          else controller.enqueue(next.value);
        } catch (error) {
          controller.error(error);
        }
      },
      async cancel(reason) {
        await reader.cancel(reason);
      },
    });
  } catch (error) {
    await reader.cancel(error).catch(() => undefined);
    throw error;
  }
}

function sizeError(purpose: MediaPurpose, type?: MediaType) {
  return purpose === 'hero' || type?.startsWith('video/')
    ? 'Use an MP4 or WebM video up to 95 MB'
    : 'Use a JPG, PNG, WebP or AVIF image up to 20 MB';
}

function mediaHeaders(object: R2Object) {
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('accept-ranges', 'bytes');
  headers.set('cache-control', 'public, max-age=31536000, immutable');
  headers.set('content-disposition', 'inline');
  headers.set('etag', object.httpEtag);
  headers.set('x-content-type-options', 'nosniff');
  return headers;
}

export async function GET(request: Request) {
  try {
    const key = safeKey(new URL(request.url).searchParams.get('key'));
    if (!key) return json({ error: 'Invalid media key' }, { status: 400 });

    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
      const rangeRequest = new Headers({ range: rangeHeader });
      if (!parseByteRange(rangeHeader, Number.MAX_SAFE_INTEGER)) {
        const metadata = await bucket().head(key);
        if (!metadata)
          return json({ error: 'Media not found' }, { status: 404 });
        const headers = mediaHeaders(metadata);
        headers.set('content-range', `bytes */${metadata.size}`);
        headers.set('content-length', '0');
        return new Response(null, { status: 416, headers });
      }
      // Passing the Range header lets R2 fetch only the requested bytes. A
      // metadata lookup is needed only for malformed or unsatisfied ranges.
      const object = await bucket().get(key, { range: rangeRequest });
      if (!object) {
        const metadata = await bucket().head(key);
        if (!metadata)
          return json({ error: 'Media not found' }, { status: 404 });
        const headers = mediaHeaders(metadata);
        headers.set('content-range', `bytes */${metadata.size}`);
        headers.set('content-length', '0');
        return new Response(null, { status: 416, headers });
      }
      const range = parseByteRange(rangeHeader, object.size);
      if (!range) {
        await object.body.cancel('Unsatisfied media range');
        const headers = mediaHeaders(object);
        headers.set('content-range', `bytes */${object.size}`);
        headers.set('content-length', '0');
        return new Response(null, { status: 416, headers });
      }
      const headers = mediaHeaders(object);
      const end = range.offset + range.length - 1;
      headers.set(
        'content-range',
        `bytes ${range.offset}-${end}/${object.size}`,
      );
      headers.set('content-length', String(range.length));
      return new Response(object.body, { status: 206, headers });
    }

    const object = await bucket().get(key);
    if (!object) return json({ error: 'Media not found' }, { status: 404 });
    const headers = mediaHeaders(object);
    headers.set('content-length', String(object.size));
    return new Response(object.body, { headers });
  } catch {
    return json({ error: 'Media service unavailable' }, { status: 503 });
  }
}

export async function HEAD(request: Request) {
  try {
    const key = safeKey(new URL(request.url).searchParams.get('key'));
    if (!key) return json({ error: 'Invalid media key' }, { status: 400 });
    const object = await bucket().head(key);
    if (!object) return json({ error: 'Media not found' }, { status: 404 });
    const headers = mediaHeaders(object);
    headers.set('content-length', String(object.size));
    return new Response(null, { headers });
  } catch {
    return json({ error: 'Media service unavailable' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request))
    return json({ error: 'Admin authorization required' }, { status: 403 });

  const purpose = requestedPurpose(request);
  if (!purpose)
    return json({ error: 'Choose a valid upload purpose' }, { status: 400 });

  const originalName = requestedName(request);
  if (!originalName)
    return json({ error: 'Choose a valid file name' }, { status: 400 });

  const type = request.headers.get('content-type')?.trim().toLowerCase() as
    | MediaType
    | undefined;
  const rule = type ? mediaTypes[type] : undefined;
  if (!type || !rule)
    return json(
      {
        error:
          purpose === 'hero'
            ? 'The hero requires an MP4 or WebM video'
            : purpose === 'gallery'
              ? 'Use a JPG, PNG, WebP, AVIF, MP4 or WebM file'
              : 'Use a JPG, PNG, WebP or AVIF image',
      },
      { status: 400 },
    );
  if (purpose === 'hero' && !type.startsWith('video/'))
    return json({ error: 'The hero requires a video file' }, { status: 400 });
  if (
    (purpose === 'vehicle' || purpose === 'hero-image') &&
    !type.startsWith('image/')
  )
    return json(
      {
        error:
          purpose === 'hero-image'
            ? 'The hero poster requires an image file'
            : 'Vehicle uploads require image files',
      },
      { status: 400 },
    );

  const limited = limitRequestBody(request, rule.maximum);
  if (!limited.ok)
    return json(
      {
        error:
          limited.status === 413 ? sizeError(purpose, type) : limited.error,
      },
      { status: limited.status },
    );
  if (limited.declaredLength === null) {
    await limited.stream.cancel('Upload length is required');
    return json(
      { error: 'The upload size could not be determined' },
      { status: 400 },
    );
  }
  if (limited.declaredLength < 16) {
    await limited.stream.cancel('Invalid media file');
    return json({ error: 'The file content is not valid' }, { status: 400 });
  }

  try {
    const upload = await validateMediaStream(limited.stream, type);
    if (!upload)
      return json({ error: 'The file content is not valid' }, { status: 400 });
    const key = `storefront/${purpose}/${Date.now()}-${crypto.randomUUID()}.${rule.extension}`;
    const uploader = requestUser(request);
    // Transformed streams have an unknown length in Workers. Re-attach the
    // validated HTTP length so R2 can ingest the body without buffering it.
    const fixed = new FixedLengthStream(limited.declaredLength);
    const pump = upload.pipeTo(fixed.writable);
    const put = bucket().put(key, fixed.readable, {
      httpMetadata: {
        contentType: type,
        cacheControl: 'public, max-age=31536000, immutable',
      },
      customMetadata: {
        originalName,
        uploadedBy: uploader?.id || 'admin',
      },
    });
    await Promise.all([pump, put]);
    return json({
      ok: true,
      url: `/api/media?key=${encodeURIComponent(key)}`,
      type,
      mediaType: type.startsWith('video/') ? 'video' : 'image',
      bytes: limited.byteLength(),
    });
  } catch (error) {
    if (limited.limitExceeded())
      return json({ error: sizeError(purpose, type) }, { status: 413 });
    const message = error instanceof Error ? error.message : '';
    if (
      /FixedLengthStream|fixed.?length|too (?:many|few) bytes|expected .*bytes/i.test(
        message,
      )
    )
      return json(
        { error: 'The uploaded file size does not match the request' },
        { status: 400 },
      );
    return json({ error: 'Media upload failed' }, { status: 503 });
  }
}
