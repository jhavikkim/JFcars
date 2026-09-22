import { env } from 'cloudflare:workers';
import { readFormData } from '@/lib/request-body';
import { isAdminRequest, json, requestUser } from '@/lib/site-db';

type RuntimeEnv = {
  MEDIA?: R2Bucket;
};

const mediaTypes = {
  'image/jpeg': { extension: 'jpg', maximum: 10 * 1024 * 1024 },
  'image/png': { extension: 'png', maximum: 10 * 1024 * 1024 },
  'image/webp': { extension: 'webp', maximum: 10 * 1024 * 1024 },
  'image/avif': { extension: 'avif', maximum: 10 * 1024 * 1024 },
  'video/mp4': { extension: 'mp4', maximum: 16 * 1024 * 1024 },
  'video/webm': { extension: 'webm', maximum: 16 * 1024 * 1024 },
} as const;
// Response.formData() materializes multipart bodies in memory. Keep enough
// headroom below Workers' isolate limit for the application and parser copies.
const maximumUploadRequestBytes = 17 * 1024 * 1024;

type MediaType = keyof typeof mediaTypes;

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
      bytes[5] === 0x0a
    );
  if (type === 'image/webp')
    return text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP';
  if (type === 'image/avif')
    return text(4, 8) === 'ftyp' && ['avif', 'avis'].includes(text(8, 12));
  if (type === 'video/mp4') return text(4, 8) === 'ftyp';
  return (
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  );
}

export async function GET(request: Request) {
  try {
    const key = safeKey(new URL(request.url).searchParams.get('key'));
    if (!key) return json({ error: 'Invalid media key' }, { status: 400 });
    const object = await bucket().get(key);
    if (!object) return json({ error: 'Media not found' }, { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('cache-control', 'public, max-age=31536000, immutable');
    headers.set('content-length', String(object.size));
    headers.set('content-disposition', 'inline');
    headers.set('etag', object.httpEtag);
    headers.set('x-content-type-options', 'nosniff');
    return new Response(object.body, { headers });
  } catch {
    return json({ error: 'Media service unavailable' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request))
    return json({ error: 'Admin authorization required' }, { status: 403 });
  try {
    const parsed = await readFormData(request, maximumUploadRequestBytes);
    if (!parsed.ok)
      return json({ error: parsed.error }, { status: parsed.status });
    const form = parsed.value;
    const upload = form.get('file');
    const purposeField = form.get('purpose');
    const purposeValue =
      typeof purposeField === 'string' ? purposeField : 'gallery';
    const purpose = purposeValue === 'hero' ? 'hero' : 'gallery';
    if (!(upload instanceof File))
      return json({ error: 'Choose a media file' }, { status: 400 });
    const type = upload.type as MediaType;
    const rule = mediaTypes[type];
    if (!rule || !upload.size || upload.size > rule.maximum)
      return json(
        {
          error:
            purpose === 'hero'
              ? 'Use an MP4 or WebM video up to 16 MB'
              : 'Use a JPG, PNG, WebP or AVIF image up to 10 MB',
        },
        { status: 413 },
      );
    if (purpose === 'hero' && !type.startsWith('video/'))
      return json({ error: 'The hero requires a video file' }, { status: 400 });
    if (purpose === 'gallery' && !type.startsWith('image/'))
      return json(
        { error: 'Shipment updates require image files' },
        { status: 400 },
      );
    const signature = new Uint8Array(await upload.slice(0, 16).arrayBuffer());
    if (!matchesSignature(signature, type))
      return json({ error: 'The file content is not valid' }, { status: 400 });
    const key = `storefront/${purpose}/${Date.now()}-${crypto.randomUUID()}.${rule.extension}`;
    const uploader = requestUser(request);
    await bucket().put(key, upload.stream(), {
      httpMetadata: { contentType: type },
      customMetadata: {
        originalName: upload.name.slice(0, 120),
        uploadedBy: uploader?.id || 'admin',
      },
    });
    return json({
      ok: true,
      url: `/api/media?key=${encodeURIComponent(key)}`,
      type,
    });
  } catch {
    return json({ error: 'Media upload failed' }, { status: 503 });
  }
}
