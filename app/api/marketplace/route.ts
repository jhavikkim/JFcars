import {
  ensureDatabase,
  isAdminRequest,
  json,
  requestUser,
} from '@/lib/site-db';
import {
  createSellRequest,
  ensureNormalizedData,
  MarketplaceRevisionConflictError,
  normalizeVehicleList,
  readMarketplaceRevision,
  readSellRequests,
  readStorefrontContent,
  readVehicles,
  replaceMarketplace,
} from '@/lib/marketplace-store';
import { readJsonObject } from '@/lib/request-body';
import { isValidEmailAddress, normalizePhoneNumber } from '@/lib/contact';
import { normalizeGalleryRecords } from '@/lib/storefront-content';
import type { Car } from '@/lib/marketplace/types';
import { VEHICLE_SELLING_ENABLED } from '@/components/jfcars/config';

export const dynamic = 'force-dynamic';

type MarketplaceState = {
  revision: number;
  inventory: unknown[] | null;
  partRequests: unknown[];
  sellerInquiries: unknown[];
  sellRequests: unknown[];
  storefrontContent: Record<string, unknown>;
};

const maximumMarketplaceRequestBytes = 2_000_000;
const maximumPublicRequestBytes = 50_000;

const marketCities: Record<string, string[]> = {
  'Republic of the Congo': ['Brazzaville', 'Pointe-Noire'],
  Angola: ['Cabinda'],
  Cameroon: ['Douala'],
  Gabon: ['Libreville'],
  'DR Congo': ['Kinshasa'],
};

const safeText = (value: unknown, max = 500) =>
  (typeof value === 'string'
    ? value
    : typeof value === 'number' || typeof value === 'boolean'
      ? String(value)
      : ''
  )
    .trim()
    .slice(0, max);
const safeNumber = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};
const safeUrl = (value: unknown) => {
  const text = safeText(value, 1000);
  try {
    const url = new URL(text);
    return url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
};
const validEmail = isValidEmailAddress;
const validPhone = (value: string) => Boolean(normalizePhoneNumber(value));
async function rateLimited(
  db: D1Database,
  request: Request,
  action: string,
  limit: number,
) {
  const identity =
    requestUser(request)?.id ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'anonymous';
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(identity),
  );
  const fingerprint = Array.from(new Uint8Array(digest))
    .slice(0, 16)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  const key = `${action}:${fingerprint}`;
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - (now % 3600);
  await db
    .prepare(
      `INSERT INTO request_limits (key, window_start, count) VALUES (?, ?, 1)
       ON CONFLICT(key) DO UPDATE SET
       window_start = CASE WHEN window_start = excluded.window_start
                           THEN window_start ELSE excluded.window_start END,
       count = CASE WHEN window_start = excluded.window_start
                    THEN count + 1 ELSE 1 END`,
    )
    .bind(key, windowStart)
    .run();
  const row = await db
    .prepare(`SELECT count FROM request_limits WHERE key = ?`)
    .bind(key)
    .first<{ count: number }>();
  return Number(row?.count || 0) > limit;
}

async function ensureMarketplaceRow() {
  const db = await ensureDatabase();
  await ensureNormalizedData(db);
  return db;
}

async function readState(includePrivate: boolean): Promise<MarketplaceState> {
  const db = await ensureMarketplaceRow();
  let inventory: Awaited<ReturnType<typeof readVehicles>> = [];
  let storefrontContent: Awaited<ReturnType<typeof readStorefrontContent>> = {};
  let revision = 0;
  let stableSnapshot = false;
  // D1 reads below are separate statements. Bracket them with the revision so
  // the client never receives a new revision paired with an older snapshot.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const before = await readMarketplaceRevision(db);
    [inventory, storefrontContent] = await Promise.all([
      readVehicles(db, includePrivate),
      readStorefrontContent(db),
    ]);
    revision = await readMarketplaceRevision(db);
    if (before === revision) {
      stableSnapshot = true;
      break;
    }
  }
  if (!stableSnapshot) throw new Error('Marketplace changed during read');
  if (!includePrivate) {
    return {
      revision,
      inventory,
      storefrontContent,
      partRequests: [],
      sellerInquiries: [],
      sellRequests: [],
    };
  }

  const [parts, inquiries, sellRequests] = await Promise.all([
    db
      .prepare(
        `SELECT pr.id, pr.user_id, pr.vehicle, pr.part, pr.condition,
                pr.delivery, pr.details, pr.status, pr.created_at,
                COALESCE(NULLIF(pr.contact_name, ''), up.name, '') AS contact_name,
                pr.contact_email,
                COALESCE(NULLIF(pr.contact_phone, ''), up.phone, '') AS contact_phone
         FROM part_requests AS pr
         LEFT JOIN user_profiles AS up ON up.user_id = pr.user_id
         ORDER BY pr.created_at DESC LIMIT 1000`,
      )
      .all<{
        id: string;
        user_id: string | null;
        vehicle: string;
        part: string;
        condition: string;
        delivery: string;
        details: string;
        contact_name: string;
        contact_email: string;
        contact_phone: string;
        status: string;
        created_at: string;
      }>(),
    db
      .prepare(
        `SELECT id, car_id, customer, phone, message, created_at
         FROM seller_inquiries ORDER BY created_at DESC LIMIT 1000`,
      )
      .all<{
        id: string;
        car_id: number;
        customer: string;
        phone: string;
        message: string;
        created_at: string;
      }>(),
    readSellRequests(db),
  ]);
  return {
    revision,
    inventory,
    storefrontContent,
    partRequests: parts.results.map((item) => ({
      id: item.id,
      vehicle: item.vehicle,
      part: item.part,
      condition: item.condition,
      delivery: item.delivery,
      details: item.details,
      contactName: item.contact_name,
      contactEmail: item.contact_email,
      contactPhone: item.contact_phone,
      status: item.status,
      createdAt: item.created_at,
    })),
    sellerInquiries: inquiries.results.map((item) => ({
      id: item.id,
      carId: item.car_id,
      customer: item.customer,
      phone: item.phone,
      message: item.message,
      createdAt: item.created_at,
    })),
    sellRequests,
  };
}

export async function GET(request: Request) {
  try {
    return json(await readState(isAdminRequest(request)));
  } catch {
    return json({ error: 'Marketplace service unavailable' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const adminRequest = isAdminRequest(request);
  const parsed = await readJsonObject(
    request,
    adminRequest ? maximumMarketplaceRequestBytes : maximumPublicRequestBytes,
  );
  if (!parsed.ok)
    return json({ error: parsed.error }, { status: parsed.status });
  const body = parsed.value;

  try {
    const db = await ensureMarketplaceRow();
    const action = safeText(body.action, 40);
    const authenticatedUser = requestUser(request);
    const userId = authenticatedUser?.id || null;
    if (action === 'sell-request' && !VEHICLE_SELLING_ENABLED)
      return json(
        { error: 'Vehicle selling is not available' },
        { status: 403 },
      );
    const publicLimit =
      action === 'sell-request'
        ? 5
        : action === 'part-request'
          ? 15
          : action === 'seller-inquiry'
            ? 30
            : 0;
    if (publicLimit && (await rateLimited(db, request, action, publicLimit)))
      return json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      );

    if (action === 'part-request') {
      const payload =
        body.payload &&
        typeof body.payload === 'object' &&
        !Array.isArray(body.payload)
          ? (body.payload as Record<string, unknown>)
          : {};
      const profile = userId
        ? await db
            .prepare(`SELECT name, phone FROM user_profiles WHERE user_id = ?`)
            .bind(userId)
            .first<{ name: string; phone: string }>()
        : null;
      const suppliedEmail = safeText(
        payload.contactEmail ?? payload.email,
        254,
      ).toLowerCase();
      const suppliedPhone = normalizePhoneNumber(
        safeText(payload.contactPhone ?? payload.phone, 60),
      );
      const profilePhone = normalizePhoneNumber(safeText(profile?.phone, 60));
      const item = {
        id: crypto.randomUUID(),
        vehicle: safeText(payload?.vehicle, 120),
        part: safeText(payload?.part, 120),
        condition: safeText(payload?.condition, 40),
        delivery: safeText(payload?.delivery, 80),
        details: safeText(payload?.details, 1000),
        contactName:
          safeText(payload.contactName ?? payload.customer, 100) ||
          safeText(profile?.name, 100) ||
          safeText(authenticatedUser?.name, 100),
        contactEmail: validEmail(suppliedEmail)
          ? suppliedEmail
          : safeText(authenticatedUser?.email, 254).toLowerCase(),
        contactPhone: suppliedPhone || profilePhone,
        status: 'Open',
      };
      if (
        !item.vehicle ||
        !item.part ||
        !item.contactName ||
        (!validEmail(item.contactEmail) && !validPhone(item.contactPhone))
      )
        return json(
          { error: 'Vehicle, part and usable contact details are required' },
          { status: 400 },
        );
      await db
        .prepare(
          `INSERT INTO part_requests
           (id, user_id, vehicle, part, condition, delivery, details,
            contact_name, contact_email, contact_phone, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Open')`,
        )
        .bind(
          item.id,
          userId,
          item.vehicle,
          item.part,
          item.condition,
          item.delivery,
          item.details,
          item.contactName,
          item.contactEmail,
          item.contactPhone,
        )
        .run();
      return json({ ok: true, item });
    }

    if (action === 'seller-inquiry') {
      const payload = body.payload as Record<string, unknown>;
      const item = {
        id: crypto.randomUUID(),
        carId: Math.round(safeNumber(payload?.carId, -1)),
        customer: safeText(payload?.customer, 100),
        phone: safeText(payload?.phone, 60),
        message: safeText(payload?.message, 1000),
      };
      if (!item.customer || !item.phone || item.carId < 0)
        return json({ error: 'Contact details are required' }, { status: 400 });
      await db
        .prepare(
          `INSERT INTO seller_inquiries
           (id, user_id, car_id, customer, phone, message)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          item.id,
          userId,
          item.carId,
          item.customer,
          item.phone,
          item.message,
        )
        .run();
      return json({ ok: true, item });
    }

    if (action === 'sell-request') {
      const payload = body.payload as Record<string, unknown>;
      const origin = payload?.origin === 'abroad' ? 'abroad' : 'local';
      const requestedRegion = safeText(payload?.importRegion);
      const importRegion: NonNullable<Car['importRegion']> = [
        'Europe',
        'Asia',
        'America',
      ].includes(requestedRegion)
        ? (requestedRegion as NonNullable<Car['importRegion']>)
        : 'Europe';
      const country = safeText(payload?.country, 80);
      const city = safeText(payload?.city, 80);
      const image = safeUrl(payload?.image);
      const extraImages = Array.isArray(payload?.images)
        ? payload.images.map(safeUrl).filter(Boolean).slice(0, 8)
        : [];
      const car: Car = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        make: safeText(payload?.make, 60),
        model: safeText(payload?.model, 100),
        year: Math.round(safeNumber(payload?.year)),
        price: Math.round(safeNumber(payload?.price)),
        km: Math.round(safeNumber(payload?.km)),
        fuel: safeText(payload?.fuel, 30),
        body: safeText(payload?.body, 30),
        origin,
        country: origin === 'local' ? country : undefined,
        city: origin === 'local' ? city : undefined,
        importRegion: origin === 'abroad' ? importRegion : undefined,
        location: origin === 'abroad' ? importRegion : city,
        engineLitres: Math.max(0, safeNumber(payload?.engineLitres)),
        sellerType: 'Private',
        verified: false,
        available: true,
        listedDaysAgo: 0,
        image,
        images: Array.from(new Set([image, ...extraImages])).filter(Boolean),
        badge: 'Pending review',
        color: safeText(payload?.color, 30),
        transmission: safeText(payload?.transmission, 30) || 'Automatic',
        drivetrain: safeText(payload?.drivetrain, 20) || 'FWD',
        doors: Math.max(
          2,
          Math.min(6, Math.round(safeNumber(payload?.doors, 5))),
        ),
        seats: Math.max(
          2,
          Math.min(12, Math.round(safeNumber(payload?.seats, 5))),
        ),
        hidden: true,
        sample: false,
      };
      const maxYear = new Date().getUTCFullYear() + 1;
      if (
        !car.make ||
        !car.model ||
        !car.image ||
        car.year < 1950 ||
        car.year > maxYear ||
        car.price <= 0 ||
        car.km < 0 ||
        (origin === 'local' &&
          (!country || !city || !marketCities[country]?.includes(city)))
      )
        return json(
          { error: 'Valid vehicle details are required' },
          { status: 400 },
        );
      const requestId = crypto.randomUUID();
      const storedCar = await createSellRequest(db, requestId, userId, car);
      return json({
        ok: true,
        item: storedCar,
        request: { id: requestId, car: storedCar, status: 'Pending' },
      });
    }

    if (action === 'admin-sync') {
      if (!isAdminRequest(request))
        return json({ error: 'Admin authorization required' }, { status: 403 });
      const inventory = Array.isArray(body.inventory)
        ? body.inventory.slice(0, 2000)
        : [];
      const normalizedInventory = normalizeVehicleList(inventory);
      if (normalizedInventory.length !== inventory.length)
        return json(
          { error: 'Inventory contains invalid or duplicate vehicles' },
          { status: 400 },
        );
      const invalidLocalInventory = inventory.some((value) => {
        if (!value || typeof value !== 'object') return true;
        const item = value as Record<string, unknown>;
        if (item.origin === 'abroad')
          return (
            item.rentable === true ||
            !['Europe', 'Asia', 'America'].includes(
              safeText(item.importRegion, 30),
            )
          );
        const itemCountry = safeText(item.country, 80);
        const itemCity = safeText(item.city, 80);
        const dailyRate = safeNumber(item.dailyRate);
        return (
          !marketCities[itemCountry]?.includes(itemCity) ||
          (item.rentable === true &&
            (dailyRate < 1000 || dailyRate > 2_000_000))
        );
      });
      if (invalidLocalInventory)
        return json(
          { error: 'Inventory contains an invalid location or rental setup' },
          { status: 400 },
        );
      const rawStorefrontContent =
        body.storefrontContent &&
        typeof body.storefrontContent === 'object' &&
        !Array.isArray(body.storefrontContent)
          ? (body.storefrontContent as Record<string, unknown>)
          : {};
      const storefrontContent = { ...rawStorefrontContent };
      if ('gallery' in rawStorefrontContent) {
        const gallery = normalizeGalleryRecords(
          rawStorefrontContent.gallery,
          8,
        );
        if (
          !Array.isArray(rawStorefrontContent.gallery) ||
          gallery.length === 0 ||
          gallery.length !== rawStorefrontContent.gallery.length
        )
          return json(
            { error: 'Storefront gallery contains invalid content' },
            { status: 400 },
          );
        storefrontContent.gallery = gallery;
      }
      const serializedInventory = JSON.stringify(inventory);
      const serializedContent = JSON.stringify(storefrontContent);
      const encodedSize = new TextEncoder().encode(
        serializedInventory + serializedContent,
      ).byteLength;
      if (
        encodedSize > 1_900_000 ||
        new TextEncoder().encode(serializedContent).byteLength > 50_000
      )
        return json(
          { error: 'Marketplace update is too large' },
          { status: 413 },
        );
      const baseRevision = Number(body.baseRevision);
      if (!Number.isSafeInteger(baseRevision) || baseRevision < 0)
        return json(
          { error: 'A valid marketplace base revision is required' },
          { status: 400 },
        );
      const result = await replaceMarketplace(
        db,
        normalizedInventory,
        storefrontContent,
        baseRevision,
      );
      return json({ ok: true, revision: result.revision });
    }

    return json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    if (error instanceof MarketplaceRevisionConflictError)
      return json(
        {
          error: 'Marketplace data changed. Reload before saving again.',
          currentRevision: error.currentRevision,
        },
        { status: 409 },
      );
    return json({ error: 'Marketplace service unavailable' }, { status: 503 });
  }
}
