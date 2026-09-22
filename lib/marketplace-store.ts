import { cars as defaultCars } from '@/components/jfcars/config';
import type {
  Car,
  GalleryItem,
  Lang,
  OrderItem,
  OrderRecord,
  SellRequest,
  StorefrontContent,
} from '@/lib/marketplace/types';
import {
  galleryItemLimit,
  isSafeImageSource,
  isSafeMediaSource,
  normalizeGalleryRecords,
} from '@/lib/storefront-content';
import { parseJson } from '@/lib/json';

const locales: Lang[] = ['en', 'fr', 'es', 'pt'];
const profileLanguages = new Set<Lang>(locales);
const profileCurrencies = new Set(['XAF', 'USD', 'EUR', 'AOA']);
const migrationNames = {
  marketplace: 'marketplace_v1',
  accounts: 'accounts_v1',
  orders: 'orders_v1',
  sellRequests: 'sell_requests_v1',
} as const;

const countryByCity: Record<string, string> = {
  Brazzaville: 'Republic of the Congo',
  'Pointe-Noire': 'Republic of the Congo',
  Cabinda: 'Angola',
  Douala: 'Cameroon',
  Libreville: 'Gabon',
  Kinshasa: 'DR Congo',
};

const cleanText = (value: unknown, maximum = 500) =>
  Array.from(
    typeof value === 'string'
      ? value
      : typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : '',
  )
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('')
    .trim()
    .slice(0, maximum);

const finiteNumber = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const optionalNumber = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
};

const uniqueImages = (value: unknown, mainImage: string) => {
  const candidates = Array.isArray(value) ? value : [];
  return Array.from(
    new Set(
      [mainImage, ...candidates]
        .filter(isSafeImageSource)
        .map((image) => cleanText(image, 1_000)),
    ),
  ).slice(0, 20);
};

export function normalizeVehicle(value: unknown, position = 0): Car | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const id = Math.round(finiteNumber(input.id));
  const make = cleanText(input.make, 60);
  const model = cleanText(input.model, 100);
  const image = isSafeImageSource(input.image)
    ? cleanText(input.image, 1_000)
    : Array.isArray(input.images) && isSafeImageSource(input.images[0])
      ? cleanText(input.images[0], 1_000)
      : '';
  if (!Number.isInteger(id) || id <= 0 || !make || !model || !image)
    return null;

  const suppliedRegion = cleanText(input.importRegion, 30);
  const importRegion = ['Europe', 'Asia', 'America'].includes(suppliedRegion)
    ? (suppliedRegion as Car['importRegion'])
    : undefined;
  const origin: 'local' | 'abroad' =
    input.origin === 'abroad' || importRegion ? 'abroad' : 'local';
  const suppliedCity = cleanText(input.city || input.location, 80);
  const city = origin === 'local' ? suppliedCity || 'Brazzaville' : undefined;
  const country =
    origin === 'local'
      ? cleanText(input.country, 80) ||
        countryByCity[city || ''] ||
        'Republic of the Congo'
      : undefined;
  const region = origin === 'abroad' ? importRegion || 'Europe' : undefined;
  const images = uniqueImages(input.images, image);
  const year = Math.round(finiteNumber(input.year));
  const currentYear = new Date().getUTCFullYear();
  if (year < 1950 || year > currentYear + 1) return null;

  return {
    id,
    make,
    model,
    year,
    price: Math.max(0, Math.round(finiteNumber(input.price))),
    km: Math.max(0, Math.round(finiteNumber(input.km))),
    fuel: cleanText(input.fuel, 30) || 'Petrol',
    body: cleanText(input.body, 30) || 'Sedan',
    location: origin === 'abroad' ? region! : city!,
    image,
    images,
    badge: cleanText(input.badge, 80),
    color: cleanText(input.color, 30) || undefined,
    transmission: cleanText(input.transmission, 30) || undefined,
    drivetrain: cleanText(input.drivetrain, 20) || undefined,
    doors: optionalNumber(input.doors),
    seats: optionalNumber(input.seats),
    hidden: input.hidden === true,
    sample: input.sample === true,
    origin,
    country,
    city,
    importRegion: region,
    engineLitres: optionalNumber(input.engineLitres),
    sellerType:
      input.sellerType === 'Private'
        ? 'Private'
        : input.sellerType === 'Dealer'
          ? 'Dealer'
          : undefined,
    verified: input.verified === true,
    available: input.available !== false,
    listedDaysAgo: Math.max(
      0,
      Math.round(finiteNumber(input.listedDaysAgo, position)),
    ),
    rentable: origin === 'local' && input.rentable === true,
    dailyRate:
      origin === 'local' && input.rentable === true
        ? Math.max(0, Math.round(finiteNumber(input.dailyRate)))
        : undefined,
  };
}

export function normalizeVehicleList(value: unknown) {
  if (!Array.isArray(value)) return [] as Car[];
  const ids = new Set<number>();
  const normalized: Car[] = [];
  value.slice(0, 2_000).forEach((entry, position) => {
    const car = normalizeVehicle(entry, position);
    if (!car || ids.has(car.id)) return;
    ids.add(car.id);
    normalized.push(car);
  });
  return normalized;
}

export function normalizeStorefrontContent(value: unknown): StorefrontContent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const input = value as Record<string, unknown>;
  const content: StorefrontContent = {};
  for (const locale of locales) {
    const localized = input[locale];
    if (!localized || typeof localized !== 'object' || Array.isArray(localized))
      continue;
    const fields = localized as Record<string, unknown>;
    content[locale] = {
      headline: cleanText(fields.headline, 160),
      description: cleanText(fields.description, 400),
      galleryTitle: cleanText(fields.galleryTitle, 160),
      galleryDescription: cleanText(fields.galleryDescription, 400),
    };
  }
  if (isSafeMediaSource(input.heroVideo))
    content.heroVideo = cleanText(input.heroVideo, 1_000);
  const gallery = normalizeGalleryRecords(input.gallery, galleryItemLimit);
  if (gallery.length) content.gallery = gallery;
  return content;
}

type VehicleRow = {
  id: number;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage_km: number;
  fuel: string;
  body: string;
  badge: string;
  color: string | null;
  transmission: string | null;
  drivetrain: string | null;
  doors: number | null;
  seats: number | null;
  origin: 'local' | 'abroad';
  country: string | null;
  city: string | null;
  import_region: 'Europe' | 'Asia' | 'America' | null;
  engine_litres: number | null;
  seller_type: 'Dealer' | 'Private' | null;
  verified: number;
  available: number;
  hidden: number;
  sample: number;
  rentable: number;
  listed_days_ago: number;
  daily_rate: number | null;
  sort_position: number;
};

type VehicleMediaRow = {
  vehicle_id: number;
  purpose: 'card' | 'gallery';
  position: number;
  url: string;
};

const vehicleUpsertSql = `
  INSERT INTO vehicles (
    id, make, model, year, price, mileage_km, fuel, body, badge, color,
    transmission, drivetrain, doors, seats, origin, country, city,
    import_region, engine_litres, seller_type, verified, available, hidden,
    sample, rentable, listed_days_ago, daily_rate, sort_position, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  ON CONFLICT(id) DO UPDATE SET
    make = excluded.make, model = excluded.model, year = excluded.year,
    price = excluded.price, mileage_km = excluded.mileage_km,
    fuel = excluded.fuel, body = excluded.body, badge = excluded.badge,
    color = excluded.color, transmission = excluded.transmission,
    drivetrain = excluded.drivetrain, doors = excluded.doors,
    seats = excluded.seats, origin = excluded.origin, country = excluded.country,
    city = excluded.city, import_region = excluded.import_region,
    engine_litres = excluded.engine_litres, seller_type = excluded.seller_type,
    verified = excluded.verified, available = excluded.available,
    hidden = excluded.hidden, sample = excluded.sample,
    rentable = excluded.rentable, listed_days_ago = excluded.listed_days_ago,
    daily_rate = excluded.daily_rate, sort_position = excluded.sort_position,
    updated_at = CURRENT_TIMESTAMP`;

function vehicleStatement(db: D1Database, car: Car, position: number) {
  const origin = car.origin === 'abroad' ? 'abroad' : 'local';
  return db
    .prepare(vehicleUpsertSql)
    .bind(
      car.id,
      car.make,
      car.model,
      car.year,
      car.price,
      car.km,
      car.fuel,
      car.body,
      car.badge || '',
      car.color || null,
      car.transmission || null,
      car.drivetrain || null,
      car.doors ?? null,
      car.seats ?? null,
      origin,
      origin === 'local' ? car.country || 'Republic of the Congo' : null,
      origin === 'local' ? car.city || car.location || 'Brazzaville' : null,
      origin === 'abroad' ? car.importRegion || 'Europe' : null,
      car.engineLitres ?? null,
      car.sellerType || null,
      car.verified ? 1 : 0,
      car.available === false ? 0 : 1,
      car.hidden ? 1 : 0,
      car.sample ? 1 : 0,
      origin === 'local' && car.rentable ? 1 : 0,
      Math.max(0, Math.round(car.listedDaysAgo || 0)),
      origin === 'local' && car.rentable
        ? Math.round(car.dailyRate || 0)
        : null,
      position,
    );
}

function vehicleMediaStatements(db: D1Database, car: Car) {
  const statements: D1PreparedStatement[] = [
    db.prepare(`DELETE FROM vehicle_media WHERE vehicle_id = ?`).bind(car.id),
    db
      .prepare(
        `INSERT INTO vehicle_media (vehicle_id, purpose, position, url)
         VALUES (?, 'card', 0, ?)`,
      )
      .bind(car.id, car.image),
  ];
  uniqueImages(car.images, car.image).forEach((image, position) => {
    statements.push(
      db
        .prepare(
          `INSERT INTO vehicle_media (vehicle_id, purpose, position, url)
           VALUES (?, 'gallery', ?, ?)`,
        )
        .bind(car.id, position, image),
    );
  });
  return statements;
}

export async function upsertVehicle(
  db: D1Database,
  value: unknown,
  position = 0,
) {
  const car = normalizeVehicle(value, position);
  if (!car) throw new Error('Invalid vehicle record');
  await db.batch([
    vehicleStatement(db, car, position),
    ...vehicleMediaStatements(db, car),
  ]);
  return car;
}

function normalizedVehicleReplacement(value: unknown) {
  const vehicles = normalizeVehicleList(value);
  if (Array.isArray(value) && vehicles.length !== value.length)
    throw new Error('Inventory contains invalid or duplicate vehicles');
  return vehicles;
}

function vehicleReplacementStatements(db: D1Database, vehicles: Car[]) {
  const payload = JSON.stringify(vehicles);
  return [
    db
      .prepare(
        `INSERT INTO vehicles (
           id, make, model, year, price, mileage_km, fuel, body, badge, color,
           transmission, drivetrain, doors, seats, origin, country, city,
           import_region, engine_litres, seller_type, verified, available,
           hidden, sample, rentable, listed_days_ago, daily_rate,
           sort_position, updated_at
         )
         SELECT
           CAST(json_extract(value, '$.id') AS INTEGER),
           json_extract(value, '$.make'), json_extract(value, '$.model'),
           CAST(json_extract(value, '$.year') AS INTEGER),
           CAST(json_extract(value, '$.price') AS INTEGER),
           CAST(json_extract(value, '$.km') AS INTEGER),
           json_extract(value, '$.fuel'), json_extract(value, '$.body'),
           COALESCE(json_extract(value, '$.badge'), ''),
           json_extract(value, '$.color'),
           json_extract(value, '$.transmission'),
           json_extract(value, '$.drivetrain'),
           CAST(json_extract(value, '$.doors') AS INTEGER),
           CAST(json_extract(value, '$.seats') AS INTEGER),
           json_extract(value, '$.origin'), json_extract(value, '$.country'),
           json_extract(value, '$.city'),
           json_extract(value, '$.importRegion'),
           CAST(json_extract(value, '$.engineLitres') AS REAL),
           json_extract(value, '$.sellerType'),
           COALESCE(CAST(json_extract(value, '$.verified') AS INTEGER), 0),
           COALESCE(CAST(json_extract(value, '$.available') AS INTEGER), 1),
           COALESCE(CAST(json_extract(value, '$.hidden') AS INTEGER), 0),
           COALESCE(CAST(json_extract(value, '$.sample') AS INTEGER), 0),
           COALESCE(CAST(json_extract(value, '$.rentable') AS INTEGER), 0),
           COALESCE(CAST(json_extract(value, '$.listedDaysAgo') AS INTEGER), 0),
           CAST(json_extract(value, '$.dailyRate') AS INTEGER),
           CAST(key AS INTEGER), CURRENT_TIMESTAMP
         FROM json_each(?) WHERE true
         ON CONFLICT(id) DO UPDATE SET
           make = excluded.make, model = excluded.model, year = excluded.year,
           price = excluded.price, mileage_km = excluded.mileage_km,
           fuel = excluded.fuel, body = excluded.body, badge = excluded.badge,
           color = excluded.color, transmission = excluded.transmission,
           drivetrain = excluded.drivetrain, doors = excluded.doors,
           seats = excluded.seats, origin = excluded.origin,
           country = excluded.country, city = excluded.city,
           import_region = excluded.import_region,
           engine_litres = excluded.engine_litres,
           seller_type = excluded.seller_type, verified = excluded.verified,
           available = excluded.available, hidden = excluded.hidden,
           sample = excluded.sample, rentable = excluded.rentable,
           listed_days_ago = excluded.listed_days_ago,
           daily_rate = excluded.daily_rate,
           sort_position = excluded.sort_position,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(payload),
    db.prepare(`DELETE FROM vehicle_media`),
    db
      .prepare(
        `INSERT INTO vehicle_media (vehicle_id, purpose, position, url)
         SELECT CAST(json_extract(value, '$.id') AS INTEGER), 'card', 0,
                json_extract(value, '$.image')
         FROM json_each(?)`,
      )
      .bind(payload),
    db
      .prepare(
        `INSERT INTO vehicle_media (vehicle_id, purpose, position, url)
         SELECT CAST(json_extract(vehicle.value, '$.id') AS INTEGER),
                'gallery', CAST(media.key AS INTEGER), media.value
         FROM json_each(?) AS vehicle
         JOIN json_each(vehicle.value, '$.images') AS media`,
      )
      .bind(payload),
    db
      .prepare(
        `DELETE FROM vehicles
         WHERE NOT EXISTS (
           SELECT 1 FROM json_each(?) AS incoming
           WHERE CAST(json_extract(incoming.value, '$.id') AS INTEGER) = vehicles.id
         )`,
      )
      .bind(payload),
  ];
}

export async function replaceVehicles(db: D1Database, value: unknown) {
  const vehicles = normalizedVehicleReplacement(value);
  await db.batch(vehicleReplacementStatements(db, vehicles));
  return vehicles;
}

export async function readVehicles(db: D1Database, includeHidden = false) {
  const [vehicleResult, mediaResult] = await Promise.all([
    db
      .prepare(
        `SELECT id, make, model, year, price, mileage_km, fuel, body, badge,
                color, transmission, drivetrain, doors, seats, origin,
                country, city, import_region, engine_litres, seller_type,
                verified, available, hidden, sample, rentable,
                listed_days_ago, daily_rate, sort_position
         FROM vehicles
         ${includeHidden ? '' : 'WHERE hidden = 0'}
         ORDER BY sort_position, id`,
      )
      .all<VehicleRow>(),
    db
      .prepare(
        `SELECT vehicle_id, purpose, position, url
         FROM vehicle_media ORDER BY vehicle_id, purpose, position`,
      )
      .all<VehicleMediaRow>(),
  ]);
  const media = new Map<number, { card?: string; gallery: string[] }>();
  for (const row of mediaResult.results) {
    const entry = media.get(row.vehicle_id) || { gallery: [] };
    if (row.purpose === 'card') entry.card = row.url;
    else entry.gallery.push(row.url);
    media.set(row.vehicle_id, entry);
  }
  return vehicleResult.results.map((row) => {
    const images = media.get(row.id) || { gallery: [] };
    const image = images.card || images.gallery[0] || '';
    return {
      id: row.id,
      make: row.make,
      model: row.model,
      year: row.year,
      price: row.price,
      km: row.mileage_km,
      fuel: row.fuel,
      body: row.body,
      badge: row.badge,
      color: row.color || undefined,
      transmission: row.transmission || undefined,
      drivetrain: row.drivetrain || undefined,
      doors: row.doors ?? undefined,
      seats: row.seats ?? undefined,
      origin: row.origin,
      country: row.country || undefined,
      city: row.city || undefined,
      importRegion: row.import_region || undefined,
      location:
        row.origin === 'abroad'
          ? row.import_region || 'Europe'
          : row.city || 'Brazzaville',
      engineLitres: row.engine_litres ?? undefined,
      sellerType: row.seller_type || undefined,
      verified: Boolean(row.verified),
      available: Boolean(row.available),
      hidden: Boolean(row.hidden),
      sample: Boolean(row.sample),
      rentable: Boolean(row.rentable),
      listedDaysAgo: row.listed_days_ago,
      dailyRate: row.daily_rate ?? undefined,
      image,
      images: images.gallery.length ? images.gallery : image ? [image] : [],
    } satisfies Car;
  });
}

function storefrontReplacement(
  db: D1Database,
  value: unknown,
): { content: StorefrontContent; statements: D1PreparedStatement[] } {
  const content = normalizeStorefrontContent(value);
  const translations = locales.flatMap((locale) => {
    const localized = content[locale];
    return localized
      ? [
          {
            locale,
            headline: localized.headline,
            description: localized.description,
            galleryTitle: localized.galleryTitle || '',
            galleryDescription: localized.galleryDescription || '',
          },
        ]
      : [];
  });
  const gallery = (content.gallery || []).map((item, position) => ({
    ...item,
    position,
  }));
  const galleryTranslations = gallery.flatMap((item) =>
    locales.map((locale) => ({
      id: item.id,
      locale,
      caption: item.captions[locale] || '',
      comment: item.comments[locale] || '',
    })),
  );
  const statements = [
    db
      .prepare(
        `INSERT INTO storefront_settings (id, hero_video_url, updated_at)
         VALUES (1, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET hero_video_url = excluded.hero_video_url,
         updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(content.heroVideo || null),
    db.prepare(`DELETE FROM storefront_translations`),
    db
      .prepare(
        `INSERT INTO storefront_translations
         (locale, headline, description, gallery_title, gallery_description)
         SELECT json_extract(value, '$.locale'),
                json_extract(value, '$.headline'),
                json_extract(value, '$.description'),
                json_extract(value, '$.galleryTitle'),
                json_extract(value, '$.galleryDescription')
         FROM json_each(?)`,
      )
      .bind(JSON.stringify(translations)),
    db.prepare(`DELETE FROM gallery_items`),
    db
      .prepare(
        `INSERT INTO gallery_items
         (id, image_url, status, event_date, departure_date, eta_date,
          location, reference, sort_position, updated_at)
         SELECT json_extract(value, '$.id'), json_extract(value, '$.image'),
                json_extract(value, '$.status'),
                COALESCE(json_extract(value, '$.date'), ''),
                COALESCE(json_extract(value, '$.departureDate'), ''),
                COALESCE(json_extract(value, '$.eta'), ''),
                json_extract(value, '$.location'),
                json_extract(value, '$.reference'),
                CAST(json_extract(value, '$.position') AS INTEGER),
                CURRENT_TIMESTAMP
         FROM json_each(?)`,
      )
      .bind(JSON.stringify(gallery)),
    db
      .prepare(
        `INSERT INTO gallery_item_translations
         (gallery_item_id, locale, caption, comment)
         SELECT json_extract(value, '$.id'), json_extract(value, '$.locale'),
                json_extract(value, '$.caption'),
                json_extract(value, '$.comment')
         FROM json_each(?)`,
      )
      .bind(JSON.stringify(galleryTranslations)),
  ];
  return { content, statements };
}

async function writeStorefrontTables(db: D1Database, value: unknown) {
  const { content, statements } = storefrontReplacement(db, value);
  await db.batch(statements);
  return content;
}

export async function readStorefrontContent(db: D1Database) {
  const [settings, translations, items, itemTranslations] = await Promise.all([
    db
      .prepare(`SELECT hero_video_url FROM storefront_settings WHERE id = 1`)
      .first<{ hero_video_url: string | null }>(),
    db
      .prepare(
        `SELECT locale, headline, description, gallery_title, gallery_description
         FROM storefront_translations`,
      )
      .all<{
        locale: Lang;
        headline: string;
        description: string;
        gallery_title: string;
        gallery_description: string;
      }>(),
    db
      .prepare(
        `SELECT id, image_url, status, event_date, departure_date, eta_date,
                location, reference
         FROM gallery_items ORDER BY sort_position, id`,
      )
      .all<{
        id: string;
        image_url: string;
        status: GalleryItem['status'];
        event_date: string;
        departure_date: string;
        eta_date: string;
        location: string;
        reference: string;
      }>(),
    db
      .prepare(
        `SELECT gallery_item_id, locale, caption, comment
         FROM gallery_item_translations`,
      )
      .all<{
        gallery_item_id: string;
        locale: Lang;
        caption: string;
        comment: string;
      }>(),
  ]);
  const content: StorefrontContent = {};
  if (settings?.hero_video_url) content.heroVideo = settings.hero_video_url;
  for (const row of translations.results) {
    if (!locales.includes(row.locale)) continue;
    content[row.locale] = {
      headline: row.headline,
      description: row.description,
      galleryTitle: row.gallery_title,
      galleryDescription: row.gallery_description,
    };
  }
  const localized = new Map<
    string,
    { captions: GalleryItem['captions']; comments: GalleryItem['comments'] }
  >();
  for (const row of itemTranslations.results) {
    const entry = localized.get(row.gallery_item_id) || {
      captions: {},
      comments: {},
    };
    entry.captions[row.locale] = row.caption;
    entry.comments[row.locale] = row.comment;
    localized.set(row.gallery_item_id, entry);
  }
  if (items.results.length) {
    content.gallery = items.results.map((row) => {
      const translation = localized.get(row.id) || {
        captions: {},
        comments: {},
      };
      return {
        id: row.id,
        image: row.image_url,
        captions: translation.captions,
        comments: translation.comments,
        status: row.status,
        date: row.event_date,
        departureDate: row.departure_date || undefined,
        eta: row.eta_date || undefined,
        location: row.location,
        reference: row.reference,
      };
    });
  }
  return content;
}

export async function replaceMarketplace(
  db: D1Database,
  inventory: unknown,
  storefront: unknown,
  expectedRevision?: number,
) {
  await db
    .prepare(`INSERT OR IGNORE INTO marketplace_state (id) VALUES (1)`)
    .run();
  const vehicles = normalizedVehicleReplacement(inventory);
  const { content, statements: storefrontStatements } = storefrontReplacement(
    db,
    storefront,
  );
  const currentRevision = await readMarketplaceRevision(db);
  const baseRevision = expectedRevision ?? currentRevision;
  if (!Number.isSafeInteger(baseRevision) || baseRevision < 0)
    throw new MarketplaceRevisionConflictError(currentRevision);
  if (baseRevision !== currentRevision)
    throw new MarketplaceRevisionConflictError(currentRevision);

  try {
    await db.batch([
      // A concurrent writer changes revision before this batch executes. In
      // that case the ELSE NULL branch violates the NOT NULL constraint and
      // rolls the entire D1 batch back instead of applying a stale snapshot.
      db
        .prepare(
          `UPDATE marketplace_state
           SET revision = CASE WHEN revision = ? THEN revision + 1 ELSE NULL END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = 1`,
        )
        .bind(baseRevision),
      ...vehicleReplacementStatements(db, vehicles),
      ...storefrontStatements,
      // Transitional mirror keeps one-release rollback compatibility.
      // Normalized tables are the canonical read source.
      db
        .prepare(
          `INSERT INTO marketplace_state
       (id, inventory, part_requests, seller_inquiries, storefront_content,
        revision, updated_at)
       VALUES (1, ?, '[]', '[]', ?, 1, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET inventory = excluded.inventory,
       storefront_content = excluded.storefront_content,
       updated_at = CURRENT_TIMESTAMP`,
        )
        .bind(JSON.stringify(vehicles), JSON.stringify(content)),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('marketplace_state.revision')) {
      throw new MarketplaceRevisionConflictError(
        await readMarketplaceRevision(db),
      );
    }
    throw error;
  }
  return { vehicles, content, revision: baseRevision + 1 };
}

export class MarketplaceRevisionConflictError extends Error {
  constructor(public readonly currentRevision: number) {
    super('Marketplace data changed before this update was applied');
    this.name = 'MarketplaceRevisionConflictError';
  }
}

export async function readMarketplaceRevision(db: D1Database) {
  const row = await db
    .prepare(`SELECT revision FROM marketplace_state WHERE id = 1`)
    .first<{ revision: number }>();
  return Math.max(0, Number(row?.revision || 0));
}

async function migrationSet(db: D1Database) {
  const result = await db
    .prepare(`SELECT name FROM data_migrations`)
    .all<{ name: string }>();
  return new Set(result.results.map((row) => row.name));
}

async function markMigration(db: D1Database, name: string) {
  await db
    .prepare(`INSERT OR IGNORE INTO data_migrations (name) VALUES (?)`)
    .bind(name)
    .run();
}

async function backfillMarketplace(db: D1Database) {
  const row = await db
    .prepare(
      `SELECT inventory, storefront_content FROM marketplace_state WHERE id = 1`,
    )
    .first<{ inventory: string | null; storefront_content: string }>();
  // A missing/null legacy inventory means this is a fresh installation and
  // receives the starter catalog. An explicit [] is an intentional empty
  // storefront and must remain empty. Historical malformed entries are
  // discarded individually instead of blocking every request forever.
  const legacy = parseJson<unknown>(row?.inventory ?? null, null);
  const source = Array.isArray(legacy)
    ? normalizeVehicleList(legacy)
    : defaultCars;
  await replaceVehicles(db, source);
  if (row?.storefront_content) {
    const legacy = parseJson<Record<string, unknown>>(
      row.storefront_content,
      {},
    );
    if (Object.keys(legacy).length) await writeStorefrontTables(db, legacy);
  }
  await markMigration(db, migrationNames.marketplace);
}

type LegacyProfile = {
  name?: string;
  phone?: string;
  country?: string;
  city?: string;
  preferredContact?: string;
  preferredLanguage?: string;
  preferredCurrency?: string;
};

const normalizedProfileLanguage = (value: unknown) => {
  const language = cleanText(value, 2) as Lang;
  return profileLanguages.has(language) ? language : '';
};

const normalizedProfileCurrency = (value: unknown) => {
  const currency = cleanText(value, 3).toUpperCase();
  return profileCurrencies.has(currency) ? currency : 'XAF';
};

function normalizedProfileStatement(
  db: D1Database,
  userId: string,
  profile: LegacyProfile,
) {
  return db
    .prepare(
      `INSERT INTO user_profiles
       (user_id, name, phone, country, city, preferred_contact,
        preferred_language, preferred_currency, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET name = excluded.name,
       phone = excluded.phone, country = excluded.country, city = excluded.city,
       preferred_contact = excluded.preferred_contact,
       preferred_language = excluded.preferred_language,
       preferred_currency = excluded.preferred_currency,
       updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      userId,
      cleanText(profile.name, 100),
      cleanText(profile.phone, 40),
      cleanText(profile.country, 80),
      cleanText(profile.city, 80),
      cleanText(profile.preferredContact, 20),
      normalizedProfileLanguage(profile.preferredLanguage),
      normalizedProfileCurrency(profile.preferredCurrency),
    );
}

function normalizedListStatements(
  db: D1Database,
  userId: string,
  lists: { cart: number[]; rentalCart: number[]; saved: number[] },
) {
  const payload = JSON.stringify([
    { kind: 'cart', ids: safeIds(lists.cart) },
    { kind: 'rental_cart', ids: safeIds(lists.rentalCart) },
    { kind: 'saved', ids: safeIds(lists.saved) },
  ]);
  return [
    db.prepare(`DELETE FROM user_vehicle_lists WHERE user_id = ?`).bind(userId),
    db
      .prepare(
        `INSERT OR IGNORE INTO user_vehicle_lists
         (user_id, vehicle_id, list_kind, position)
         SELECT ?, vehicles.id, json_extract(bucket.value, '$.kind'),
                CAST(item.key AS INTEGER)
         FROM json_each(?) AS bucket
         JOIN json_each(bucket.value, '$.ids') AS item
         JOIN vehicles ON vehicles.id = CAST(item.value AS INTEGER)`,
      )
      .bind(userId, payload),
  ];
}

const safeIds = (value: unknown) =>
  Array.isArray(value)
    ? Array.from(
        new Set(
          value.map(Number).filter((id) => Number.isInteger(id) && id > 0),
        ),
      ).slice(0, 200)
    : [];

async function backfillAccounts(db: D1Database) {
  await db.batch([
    db.prepare(
      `INSERT INTO user_profiles
       (user_id, name, phone, country, city, preferred_contact,
        preferred_language, preferred_currency, updated_at)
       SELECT user_id,
              SUBSTR(TRIM(COALESCE(json_extract(
                CASE WHEN json_valid(profile) THEN profile ELSE '{}' END,
                '$.name'), '')), 1, 100),
              SUBSTR(TRIM(COALESCE(json_extract(
                CASE WHEN json_valid(profile) THEN profile ELSE '{}' END,
                '$.phone'), '')), 1, 40),
              SUBSTR(TRIM(COALESCE(json_extract(
                CASE WHEN json_valid(profile) THEN profile ELSE '{}' END,
                '$.country'), '')), 1, 80),
              SUBSTR(TRIM(COALESCE(json_extract(
                CASE WHEN json_valid(profile) THEN profile ELSE '{}' END,
                '$.city'), '')), 1, 80),
              SUBSTR(TRIM(COALESCE(json_extract(
                CASE WHEN json_valid(profile) THEN profile ELSE '{}' END,
                '$.preferredContact'), '')), 1, 20),
              CASE WHEN SUBSTR(TRIM(COALESCE(json_extract(
                CASE WHEN json_valid(profile) THEN profile ELSE '{}' END,
                '$.preferredLanguage'), '')), 1, 2)
                IN ('en', 'fr', 'es', 'pt')
              THEN SUBSTR(TRIM(COALESCE(json_extract(
                CASE WHEN json_valid(profile) THEN profile ELSE '{}' END,
                '$.preferredLanguage'), '')), 1, 2)
              ELSE '' END,
              CASE WHEN UPPER(SUBSTR(TRIM(COALESCE(json_extract(
                CASE WHEN json_valid(profile) THEN profile ELSE '{}' END,
                '$.preferredCurrency'), 'XAF')), 1, 3))
                IN ('XAF', 'USD', 'EUR', 'AOA')
              THEN UPPER(SUBSTR(TRIM(COALESCE(json_extract(
                CASE WHEN json_valid(profile) THEN profile ELSE '{}' END,
                '$.preferredCurrency'), 'XAF')), 1, 3))
              ELSE 'XAF' END,
              CURRENT_TIMESTAMP
       FROM account_state WHERE true
       ON CONFLICT(user_id) DO UPDATE SET name = excluded.name,
       phone = excluded.phone, country = excluded.country,
       city = excluded.city, preferred_contact = excluded.preferred_contact,
       preferred_language = excluded.preferred_language,
       preferred_currency = excluded.preferred_currency,
       updated_at = CURRENT_TIMESTAMP`,
    ),
    db.prepare(
      `DELETE FROM user_vehicle_lists
       WHERE user_id IN (SELECT user_id FROM account_state)`,
    ),
    db.prepare(
      `INSERT OR IGNORE INTO user_vehicle_lists
       (user_id, vehicle_id, list_kind, position)
       SELECT account_state.user_id, vehicles.id, bucket.key,
              CAST(item.key AS INTEGER)
       FROM account_state
       JOIN json_each(json_object(
         'cart', json(CASE WHEN json_valid(cart) THEN cart ELSE '[]' END),
         'rental_cart', json(CASE WHEN json_valid(rental_cart) THEN rental_cart ELSE '[]' END),
         'saved', json(CASE WHEN json_valid(saved) THEN saved ELSE '[]' END)
       )) AS bucket
       JOIN json_each(bucket.value) AS item
       JOIN vehicles ON vehicles.id = CAST(item.value AS INTEGER)`,
    ),
  ]);
  await markMigration(db, migrationNames.accounts);
}

function normalizeOrderItem(value: unknown): OrderItem | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const carId = Math.round(finiteNumber(input.carId));
  const vehicle = cleanText(input.vehicle, 180);
  const amount = Math.round(finiteNumber(input.amount));
  if (carId <= 0 || !vehicle || amount < 0) return null;
  return {
    carId,
    vehicle,
    kind: input.kind === 'rent' ? 'rent' : 'buy',
    amount,
    rentalStart: cleanText(input.rentalStart, 10) || undefined,
    rentalEnd: cleanText(input.rentalEnd, 10) || undefined,
    rentalDays: optionalNumber(input.rentalDays),
    pickup: cleanText(input.pickup, 100) || undefined,
  };
}

function normalizeOrderItems(value: unknown) {
  return Array.isArray(value)
    ? value
        .map(normalizeOrderItem)
        .filter((item): item is OrderItem => Boolean(item))
    : [];
}

function orderItemsInsertStatement(
  db: D1Database,
  orderId: string,
  items: OrderItem[],
) {
  return db
    .prepare(
      `INSERT INTO order_items
       (order_id, position, vehicle_id, vehicle_snapshot_id, vehicle_name,
        kind, amount, rental_start, rental_end, rental_days, pickup)
       SELECT ?, CAST(item.key AS INTEGER), vehicles.id,
              CAST(json_extract(item.value, '$.carId') AS INTEGER),
              json_extract(item.value, '$.vehicle'),
              json_extract(item.value, '$.kind'),
              CAST(json_extract(item.value, '$.amount') AS INTEGER),
              json_extract(item.value, '$.rentalStart'),
              json_extract(item.value, '$.rentalEnd'),
              CAST(json_extract(item.value, '$.rentalDays') AS INTEGER),
              json_extract(item.value, '$.pickup')
       FROM json_each(?) AS item
       LEFT JOIN vehicles
         ON vehicles.id = CAST(json_extract(item.value, '$.carId') AS INTEGER)`,
    )
    .bind(orderId, JSON.stringify(items));
}

async function backfillOrders(db: D1Database) {
  await db.batch([
    db.prepare(`DELETE FROM order_items`),
    db.prepare(
      `INSERT INTO order_items
       (order_id, position, vehicle_id, vehicle_snapshot_id, vehicle_name,
        kind, amount, rental_start, rental_end, rental_days, pickup)
       SELECT orders.id, CAST(item.key AS INTEGER), vehicles.id,
              CAST(json_extract(item.value, '$.carId') AS INTEGER),
              SUBSTR(TRIM(json_extract(item.value, '$.vehicle')), 1, 180),
              CASE WHEN json_extract(item.value, '$.kind') = 'rent'
                   THEN 'rent' ELSE 'buy' END,
              CAST(json_extract(item.value, '$.amount') AS INTEGER),
              SUBSTR(json_extract(item.value, '$.rentalStart'), 1, 10),
              SUBSTR(json_extract(item.value, '$.rentalEnd'), 1, 10),
              CAST(json_extract(item.value, '$.rentalDays') AS INTEGER),
              SUBSTR(json_extract(item.value, '$.pickup'), 1, 100)
       FROM orders
       JOIN json_each(CASE WHEN json_valid(orders.items)
                           THEN orders.items ELSE '[]' END) AS item
       LEFT JOIN vehicles
         ON vehicles.id = CAST(json_extract(item.value, '$.carId') AS INTEGER)
       WHERE item.type = 'object'
         AND CAST(json_extract(item.value, '$.carId') AS INTEGER) > 0
         AND LENGTH(TRIM(COALESCE(json_extract(item.value, '$.vehicle'), ''))) > 0
         AND CAST(json_extract(item.value, '$.amount') AS INTEGER) >= 0`,
    ),
  ]);
  await markMigration(db, migrationNames.orders);
}

function sellRequestDetailStatements(
  db: D1Database,
  requestId: string,
  car: Car,
) {
  const origin = car.origin === 'abroad' ? 'abroad' : 'local';
  const statements: D1PreparedStatement[] = [
    db
      .prepare(
        `INSERT INTO sell_request_details
         (request_id, vehicle_id, make, model, year, price, mileage_km, fuel,
          body, origin, country, city, import_region, engine_litres,
          seller_type, color, transmission, drivetrain, doors, seats, badge,
          verified, available, hidden, sample, listed_days_ago)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(request_id) DO UPDATE SET vehicle_id = excluded.vehicle_id,
         make = excluded.make, model = excluded.model, year = excluded.year,
         price = excluded.price, mileage_km = excluded.mileage_km,
         fuel = excluded.fuel, body = excluded.body, origin = excluded.origin,
         country = excluded.country, city = excluded.city,
         import_region = excluded.import_region,
         engine_litres = excluded.engine_litres,
         seller_type = excluded.seller_type, color = excluded.color,
         transmission = excluded.transmission,
         drivetrain = excluded.drivetrain, doors = excluded.doors,
         seats = excluded.seats, badge = excluded.badge,
         verified = excluded.verified, available = excluded.available,
         hidden = excluded.hidden, sample = excluded.sample,
         listed_days_ago = excluded.listed_days_ago`,
      )
      .bind(
        requestId,
        car.id,
        car.make,
        car.model,
        car.year,
        car.price,
        car.km,
        car.fuel,
        car.body,
        origin,
        origin === 'local' ? car.country || 'Republic of the Congo' : null,
        origin === 'local' ? car.city || car.location : null,
        origin === 'abroad' ? car.importRegion || 'Europe' : null,
        car.engineLitres ?? null,
        car.sellerType || 'Private',
        car.color || null,
        car.transmission || null,
        car.drivetrain || null,
        car.doors ?? null,
        car.seats ?? null,
        car.badge || 'Pending review',
        car.verified ? 1 : 0,
        car.available === false ? 0 : 1,
        car.hidden ? 1 : 0,
        car.sample ? 1 : 0,
        Math.max(0, Math.round(car.listedDaysAgo || 0)),
      ),
    db
      .prepare(`DELETE FROM sell_request_media WHERE request_id = ?`)
      .bind(requestId),
  ];
  uniqueImages(car.images, car.image).forEach((image, position) => {
    statements.push(
      db
        .prepare(
          `INSERT INTO sell_request_media (request_id, position, url)
           VALUES (?, ?, ?)`,
        )
        .bind(requestId, position, image),
    );
  });
  return statements;
}

async function backfillSellRequests(db: D1Database) {
  await db.batch([
    db.prepare(`DELETE FROM sell_request_details`),
    db.prepare(`DELETE FROM sell_request_media`),
    db.prepare(
      `INSERT INTO sell_request_details
       (request_id, vehicle_id, make, model, year, price, mileage_km, fuel,
        body, origin, country, city, import_region, engine_litres,
        seller_type, color, transmission, drivetrain, doors, seats, badge,
        verified, available, hidden, sample, listed_days_ago)
       SELECT id,
              CAST(json_extract(payload, '$.id') AS INTEGER),
              SUBSTR(TRIM(json_extract(payload, '$.make')), 1, 60),
              SUBSTR(TRIM(json_extract(payload, '$.model')), 1, 100),
              CAST(json_extract(payload, '$.year') AS INTEGER),
              MAX(0, CAST(json_extract(payload, '$.price') AS INTEGER)),
              MAX(0, CAST(json_extract(payload, '$.km') AS INTEGER)),
              COALESCE(NULLIF(SUBSTR(TRIM(json_extract(payload, '$.fuel')), 1, 30), ''), 'Petrol'),
              COALESCE(NULLIF(SUBSTR(TRIM(json_extract(payload, '$.body')), 1, 30), ''), 'Sedan'),
              CASE WHEN json_extract(payload, '$.origin') = 'abroad'
                   THEN 'abroad' ELSE 'local' END,
              CASE WHEN json_extract(payload, '$.origin') = 'abroad' THEN NULL
                   ELSE COALESCE(NULLIF(SUBSTR(TRIM(json_extract(payload, '$.country')), 1, 80), ''), 'Republic of the Congo') END,
              CASE WHEN json_extract(payload, '$.origin') = 'abroad' THEN NULL
                   ELSE COALESCE(NULLIF(SUBSTR(TRIM(json_extract(payload, '$.city')), 1, 80), ''), 'Brazzaville') END,
              CASE WHEN json_extract(payload, '$.origin') = 'abroad'
                   THEN CASE WHEN json_extract(payload, '$.importRegion') IN ('Europe', 'Asia', 'America')
                             THEN json_extract(payload, '$.importRegion') ELSE 'Europe' END
                   ELSE NULL END,
              CAST(json_extract(payload, '$.engineLitres') AS REAL),
              CASE WHEN json_extract(payload, '$.sellerType') = 'Dealer'
                   THEN 'Dealer' ELSE 'Private' END,
              SUBSTR(json_extract(payload, '$.color'), 1, 30),
              SUBSTR(json_extract(payload, '$.transmission'), 1, 30),
              SUBSTR(json_extract(payload, '$.drivetrain'), 1, 20),
              CAST(json_extract(payload, '$.doors') AS INTEGER),
              CAST(json_extract(payload, '$.seats') AS INTEGER),
              COALESCE(NULLIF(SUBSTR(TRIM(json_extract(payload, '$.badge')), 1, 80), ''), 'Pending review'),
              COALESCE(CAST(json_extract(payload, '$.verified') AS INTEGER), 0),
              COALESCE(CAST(json_extract(payload, '$.available') AS INTEGER), 1),
              COALESCE(CAST(json_extract(payload, '$.hidden') AS INTEGER), 1),
              COALESCE(CAST(json_extract(payload, '$.sample') AS INTEGER), 0),
              MAX(0, COALESCE(CAST(json_extract(payload, '$.listedDaysAgo') AS INTEGER), 0))
       FROM sell_requests
       WHERE json_valid(payload)
         AND CAST(json_extract(payload, '$.id') AS INTEGER) > 0
         AND LENGTH(TRIM(COALESCE(json_extract(payload, '$.make'), ''))) > 0
         AND LENGTH(TRIM(COALESCE(json_extract(payload, '$.model'), ''))) > 0`,
    ),
    db.prepare(
      `INSERT INTO sell_request_media (request_id, position, url)
       SELECT sell_requests.id, CAST(media.key AS INTEGER), media.value
       FROM sell_requests
       JOIN json_each(
         CASE WHEN json_valid(sell_requests.payload) THEN
           CASE WHEN json_type(sell_requests.payload, '$.images') = 'array'
                THEN json_extract(sell_requests.payload, '$.images') ELSE '[]' END
         ELSE '[]' END
       ) AS media
       WHERE json_valid(sell_requests.payload)
         AND media.type = 'text'
         AND LENGTH(media.value) > 0`,
    ),
    db.prepare(
      `INSERT OR IGNORE INTO sell_request_media (request_id, position, url)
       SELECT id, 0, json_extract(payload, '$.image')
       FROM sell_requests
       WHERE json_valid(payload)
         AND LENGTH(COALESCE(json_extract(payload, '$.image'), '')) > 0`,
    ),
  ]);
  await markMigration(db, migrationNames.sellRequests);
}

export async function ensureNormalizedData(db: D1Database) {
  const done = await migrationSet(db);
  if (!done.has(migrationNames.marketplace)) await backfillMarketplace(db);
  if (!done.has(migrationNames.accounts)) await backfillAccounts(db);
  if (!done.has(migrationNames.orders)) await backfillOrders(db);
  if (!done.has(migrationNames.sellRequests)) await backfillSellRequests(db);
}

export async function readAccountState(db: D1Database, userId: string) {
  const [profile, lists] = await Promise.all([
    db
      .prepare(
        `SELECT name, phone, country, city, preferred_contact,
                preferred_language, preferred_currency
         FROM user_profiles WHERE user_id = ?`,
      )
      .bind(userId)
      .first<{
        name: string;
        phone: string;
        country: string;
        city: string;
        preferred_contact: string;
        preferred_language: string;
        preferred_currency: string;
      }>(),
    db
      .prepare(
        `SELECT vehicle_id, list_kind FROM user_vehicle_lists
         WHERE user_id = ? ORDER BY list_kind, position`,
      )
      .bind(userId)
      .all<{
        vehicle_id: number;
        list_kind: 'cart' | 'rental_cart' | 'saved';
      }>(),
  ]);
  return {
    profile,
    cart: lists.results
      .filter((row) => row.list_kind === 'cart')
      .map((row) => row.vehicle_id),
    rentalCart: lists.results
      .filter((row) => row.list_kind === 'rental_cart')
      .map((row) => row.vehicle_id),
    saved: lists.results
      .filter((row) => row.list_kind === 'saved')
      .map((row) => row.vehicle_id),
  };
}

export async function saveAccountState(
  db: D1Database,
  userId: string,
  profile: LegacyProfile,
  lists: { cart: number[]; rentalCart: number[]; saved: number[] },
) {
  await db.batch([
    normalizedProfileStatement(db, userId, profile),
    ...normalizedListStatements(db, userId, lists),
    db
      .prepare(
        `INSERT INTO account_state
       (user_id, profile, cart, rental_cart, saved, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET profile = excluded.profile,
       cart = excluded.cart, rental_cart = excluded.rental_cart,
       saved = excluded.saved, updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        userId,
        JSON.stringify(profile),
        JSON.stringify(lists.cart),
        JSON.stringify(lists.rentalCart),
        JSON.stringify(lists.saved),
      ),
  ]);
}

export async function readOrders(db: D1Database, userId?: string) {
  const orderResult = userId
    ? await db
        .prepare(
          `SELECT id, email, total, status, created_at FROM orders
           WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 500`,
        )
        .bind(userId)
        .all<{
          id: string;
          email: string;
          total: number;
          status: string;
          created_at: string;
        }>()
    : await db
        .prepare(
          `SELECT id, email, total, status, created_at FROM orders
           ORDER BY created_at DESC, id DESC LIMIT 500`,
        )
        .all<{
          id: string;
          email: string;
          total: number;
          status: string;
          created_at: string;
        }>();
  if (!orderResult.results.length) return [] as OrderRecord[];
  const itemQuery = userId
    ? db
        .prepare(
          `WITH visible_orders AS (
             SELECT id FROM orders WHERE user_id = ?
             ORDER BY created_at DESC, id DESC LIMIT 500
           )
           SELECT i.order_id, i.vehicle_snapshot_id, i.vehicle_name,
                  i.kind, i.amount,
                  i.rental_start, i.rental_end, i.rental_days, i.pickup
           FROM order_items i
           JOIN visible_orders o ON o.id = i.order_id
           ORDER BY i.order_id, i.position`,
        )
        .bind(userId)
    : db.prepare(
        `WITH visible_orders AS (
           SELECT id FROM orders
           ORDER BY created_at DESC, id DESC LIMIT 500
         )
         SELECT i.order_id, i.vehicle_snapshot_id, i.vehicle_name,
                i.kind, i.amount,
                i.rental_start, i.rental_end, i.rental_days, i.pickup
         FROM order_items i
         JOIN visible_orders o ON o.id = i.order_id
         ORDER BY i.order_id, i.position`,
      );
  const itemResult = await itemQuery.all<{
    order_id: string;
    vehicle_snapshot_id: number;
    vehicle_name: string;
    kind: 'buy' | 'rent';
    amount: number;
    rental_start: string | null;
    rental_end: string | null;
    rental_days: number | null;
    pickup: string | null;
  }>();
  const visibleOrderIds = new Set(orderResult.results.map((order) => order.id));
  const items = new Map<string, OrderItem[]>();
  for (const row of itemResult.results) {
    if (!visibleOrderIds.has(row.order_id)) continue;
    const list = items.get(row.order_id) || [];
    list.push({
      carId: row.vehicle_snapshot_id,
      vehicle: row.vehicle_name,
      kind: row.kind,
      amount: row.amount,
      rentalStart: row.rental_start || undefined,
      rentalEnd: row.rental_end || undefined,
      rentalDays: row.rental_days ?? undefined,
      pickup: row.pickup || undefined,
    });
    items.set(row.order_id, list);
  }
  return orderResult.results.map((order) => ({
    id: order.id,
    email: order.email,
    items: items.get(order.id) || [],
    total: order.total,
    status: order.status,
    createdAt: order.created_at,
  }));
}

export async function createOrder(
  db: D1Database,
  input: {
    id: string;
    userId: string;
    email: string;
    items: OrderItem[];
    total: number;
  },
) {
  const items = normalizeOrderItems(input.items);
  if (!items.length || items.length !== input.items.length)
    throw new Error('Invalid order items');
  await db.batch([
    db
      .prepare(
        `INSERT INTO orders (id, user_id, email, items, total, status)
       VALUES (?, ?, ?, ?, ?, 'New')`,
      )
      .bind(
        input.id,
        input.userId,
        input.email,
        JSON.stringify(items),
        input.total,
      ),
    orderItemsInsertStatement(db, input.id, items),
  ]);
}

export async function createSellRequest(
  db: D1Database,
  requestId: string,
  userId: string | null,
  car: Car,
) {
  const stored = normalizeVehicle(car);
  if (!stored) throw new Error('Invalid seller vehicle');
  await db.batch([
    db
      .prepare(
        `INSERT INTO sell_requests (id, user_id, payload, status)
       VALUES (?, ?, ?, 'Pending')`,
      )
      .bind(requestId, userId, JSON.stringify(stored)),
    ...sellRequestDetailStatements(db, requestId, stored),
  ]);
  return stored;
}

export async function readSellRequests(db: D1Database) {
  const [details, media] = await Promise.all([
    db
      .prepare(
        `SELECT r.id, r.status, r.created_at, d.vehicle_id, d.make, d.model,
                d.year, d.price, d.mileage_km, d.fuel, d.body, d.origin,
                d.country, d.city, d.import_region, d.engine_litres,
                d.seller_type, d.color, d.transmission, d.drivetrain,
                d.doors, d.seats, d.badge, d.verified, d.available,
                d.hidden, d.sample, d.listed_days_ago
         FROM sell_requests r
         JOIN sell_request_details d ON d.request_id = r.id
         ORDER BY r.created_at DESC LIMIT 1000`,
      )
      .all<Record<string, string | number | null>>(),
    db
      .prepare(
        `SELECT request_id, position, url FROM sell_request_media
         ORDER BY request_id, position`,
      )
      .all<{ request_id: string; position: number; url: string }>(),
  ]);
  const images = new Map<string, string[]>();
  for (const row of media.results) {
    const list = images.get(row.request_id) || [];
    list.push(row.url);
    images.set(row.request_id, list);
  }
  return details.results.map((row) => {
    const list = images.get(String(row.id)) || [];
    const origin = row.origin === 'abroad' ? 'abroad' : 'local';
    return {
      id: String(row.id),
      status: String(row.status) as SellRequest['status'],
      createdAt: String(row.created_at),
      car: {
        id: Number(row.vehicle_id),
        make: String(row.make),
        model: String(row.model),
        year: Number(row.year),
        price: Number(row.price),
        km: Number(row.mileage_km),
        fuel: String(row.fuel),
        body: String(row.body),
        origin,
        country: origin === 'local' ? String(row.country || '') : undefined,
        city: origin === 'local' ? String(row.city || '') : undefined,
        importRegion:
          origin === 'abroad'
            ? (String(row.import_region || 'Europe') as Car['importRegion'])
            : undefined,
        location:
          origin === 'abroad'
            ? String(row.import_region || 'Europe')
            : String(row.city || ''),
        engineLitres:
          row.engine_litres === null ? undefined : Number(row.engine_litres),
        sellerType: String(row.seller_type || 'Private') as Car['sellerType'],
        color: row.color ? String(row.color) : undefined,
        transmission: row.transmission ? String(row.transmission) : undefined,
        drivetrain: row.drivetrain ? String(row.drivetrain) : undefined,
        doors: row.doors === null ? undefined : Number(row.doors),
        seats: row.seats === null ? undefined : Number(row.seats),
        badge: String(row.badge || 'Pending review'),
        verified: Boolean(row.verified),
        available: Boolean(row.available),
        hidden: Boolean(row.hidden),
        sample: Boolean(row.sample),
        listedDaysAgo: Number(row.listed_days_ago || 0),
        rentable: false,
        image: list[0] || '',
        images: list,
      },
    } satisfies SellRequest;
  });
}

export async function acceptSellRequest(db: D1Database, id: string) {
  await db
    .prepare(`INSERT OR IGNORE INTO marketplace_state (id) VALUES (1)`)
    .run();
  // Capture the revision before any source reads. The guarded batch below then
  // proves that both the inventory snapshot and Pending request are still
  // current when the accepted vehicle is published.
  const baseRevision = await readMarketplaceRevision(db);
  const request = (await readSellRequests(db)).find((item) => item.id === id);
  if (!request || request.status !== 'Pending') return null;
  const current = await readVehicles(db, true);
  const existingPosition = current.findIndex(
    (item) => item.id === request.car.id,
  );
  const position = existingPosition >= 0 ? existingPosition : current.length;
  const car = normalizeVehicle(
    { ...request.car, hidden: false, badge: 'New listing' },
    position,
  );
  if (!car) return null;
  const inventory =
    existingPosition >= 0
      ? current.map((item, index) => (index === existingPosition ? car : item))
      : [...current, car];
  try {
    await db.batch([
      db
        .prepare(
          `UPDATE marketplace_state
           SET revision = CASE
                 WHEN revision = ? AND EXISTS (
                   SELECT 1 FROM sell_requests
                   WHERE id = ? AND status = 'Pending'
                 ) THEN revision + 1
                 ELSE NULL
               END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = 1`,
        )
        .bind(baseRevision, id),
      vehicleStatement(db, car, position),
      ...vehicleMediaStatements(db, car),
      db
        .prepare(
          `UPDATE sell_requests SET status = 'Accepted'
         WHERE id = ? AND status = 'Pending'`,
        )
        .bind(id),
      db
        .prepare(
          `INSERT INTO marketplace_state
       (id, inventory, part_requests, seller_inquiries, storefront_content)
       VALUES (1, ?, '[]', '[]', '{}')
       ON CONFLICT(id) DO UPDATE SET inventory = excluded.inventory,
       updated_at = CURRENT_TIMESTAMP`,
        )
        .bind(JSON.stringify(inventory)),
    ]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('marketplace_state.revision'))
      throw new MarketplaceRevisionConflictError(
        await readMarketplaceRevision(db),
      );
    throw error;
  }
  return { car, revision: baseRevision + 1 };
}
