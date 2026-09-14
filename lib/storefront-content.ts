export const galleryStatuses = [
  'ready_to_load',
  'loaded',
  'ready_to_ship',
  'shipped_out',
  'in_transit',
  'arrived_unloaded',
  'in_store',
] as const;

export const galleryItemLimit = 500;

export type GalleryStatus = (typeof galleryStatuses)[number];
export type StorefrontLang = 'en' | 'fr' | 'es';
export type LocalizedText = Partial<Record<StorefrontLang, string>>;

export type GalleryItemRecord = {
  id: string;
  image: string;
  captions: LocalizedText;
  comments: LocalizedText;
  status: GalleryStatus;
  date: string;
  departureDate?: string;
  eta?: string;
  location: string;
  reference: string;
};

const isControlCharacter = (character: string) => {
  const code = character.charCodeAt(0);
  return code <= 31 || code === 127;
};

const hasControlCharacters = (value: string) =>
  Array.from(value).some(isControlCharacter);

export function isSafeImageSource(value: unknown): value is string {
  if (typeof value !== 'string' || !value || hasControlCharacters(value))
    return false;
  if (value.startsWith('/')) return !value.startsWith('//');
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

export const isSafeMediaSource = isSafeImageSource;

function text(value: unknown, maximum: number) {
  return typeof value === 'string'
    ? Array.from(value)
        .filter((character) => !isControlCharacter(character))
        .join('')
        .trim()
        .slice(0, maximum)
    : '';
}

function localized(value: unknown, maximum: number): LocalizedText {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  return {
    en: text(source.en, maximum),
    fr: text(source.fr, maximum),
    es: text(source.es, maximum),
  };
}

function inferredStatus(id: string): GalleryStatus {
  if (id.includes('unload') || id.includes('arrival'))
    return 'arrived_unloaded';
  if (id.includes('part') || id.includes('store')) return 'in_store';
  if (id.includes('shipped') || id.includes('depart')) return 'shipped_out';
  return 'ready_to_load';
}

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function normalizeGalleryRecords(value: unknown, limit = galleryItemLimit) {
  if (!Array.isArray(value)) return [] as GalleryItemRecord[];
  const ids = new Set<string>();
  const records: GalleryItemRecord[] = [];
  for (const raw of value.slice(0, limit)) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const item = raw as Record<string, unknown>;
    const id = text(item.id, 80);
    const image = item.image;
    if (!id || ids.has(id) || !isSafeImageSource(image)) continue;
    const suppliedStatus = text(item.status, 40);
    if (
      suppliedStatus &&
      !galleryStatuses.includes(suppliedStatus as GalleryStatus)
    )
      continue;
    const date = text(item.date, 10);
    if (date && !isIsoDate(date)) continue;
    const departureDate = text(item.departureDate, 10);
    const eta = text(item.eta, 10);
    if (departureDate && !isIsoDate(departureDate)) continue;
    if (eta && !isIsoDate(eta)) continue;
    ids.add(id);
    records.push({
      id,
      image,
      captions: localized(item.captions, 140),
      comments: localized(item.comments, 600),
      status: (suppliedStatus as GalleryStatus) || inferredStatus(id),
      date,
      departureDate,
      eta,
      location: text(item.location, 100),
      reference: text(item.reference, 100),
    });
  }
  return records;
}
