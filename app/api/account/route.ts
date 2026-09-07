import { ensureDatabase, json, parseJson, requestUser } from '@/lib/site-db';

export const dynamic = 'force-dynamic';

type StoredProfile = {
  name?: string;
  phone?: string;
  country?: string;
  city?: string;
  preferredContact?: string;
  preferredLanguage?: string;
};

const profileMarkets = new Set([
  'Republic of the Congo',
  'Angola',
  'Cameroon',
  'Gabon',
  'DR Congo',
]);
const contactPreferences = new Set(['WhatsApp', 'Phone', 'Email']);
const profileLanguages = new Set(['en', 'fr', 'es']);
const cleanText = (value: unknown, max: number) =>
  Array.from(typeof value === 'string' ? value : '')
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code >= 32 && code !== 127;
    })
    .join('')
    .trim()
    .slice(0, max);
const normalizeProfile = (input: StoredProfile, fallbackName: string) => {
  const country = cleanText(input.country, 80);
  const preferredContact = cleanText(input.preferredContact, 20);
  const preferredLanguage = cleanText(input.preferredLanguage, 2);
  return {
    name: cleanText(input.name, 100) || fallbackName,
    phone: cleanText(input.phone, 40),
    country: profileMarkets.has(country) ? country : '',
    city: cleanText(input.city, 80),
    preferredContact: contactPreferences.has(preferredContact)
      ? preferredContact
      : '',
    preferredLanguage: profileLanguages.has(preferredLanguage)
      ? preferredLanguage
      : '',
  };
};

export async function GET(request: Request) {
  const user = requestUser(request);
  if (!user && process.env.NODE_ENV !== 'development')
    return json({ error: 'Sign in required' }, { status: 401 });
  const identity = user ?? {
    id: 'local-admin',
    email: 'admin@jfcars.local',
    name: 'Local Admin',
  };
  try {
    const db = await ensureDatabase();
    const row = await db
      .prepare(
        `SELECT profile, cart, rental_cart, saved
         FROM account_state WHERE user_id = ?`,
      )
      .bind(identity.id)
      .first<{
        profile: string;
        cart: string;
        rental_cart: string;
        saved: string;
      }>();
    const orderRows = await db
      .prepare(
        `SELECT id, email, items, total, status, created_at
         FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`,
      )
      .bind(identity.id)
      .all<{
        id: string;
        email: string;
        items: string;
        total: number;
        status: string;
        created_at: string;
      }>();
    const partCount = await db
      .prepare(`SELECT COUNT(*) AS count FROM part_requests WHERE user_id = ?`)
      .bind(identity.id)
      .first<{ count: number }>();
    const profile = normalizeProfile(
      parseJson<StoredProfile>(row?.profile ?? null, {}),
      identity.name,
    );
    return json({
      user: {
        ...profile,
        email: identity.email,
      },
      cart: parseJson<number[]>(row?.cart ?? null, []),
      rentalCart: parseJson<number[]>(row?.rental_cart ?? null, []),
      saved: parseJson<number[]>(row?.saved ?? null, []),
      partRequestCount: Number(partCount?.count || 0),
      orders: orderRows.results.map((order) => ({
        id: order.id,
        email: order.email,
        items: parseJson<unknown[]>(order.items, []),
        total: order.total,
        status: order.status,
        createdAt: order.created_at,
      })),
    });
  } catch {
    return json({ error: 'Account service unavailable' }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const user = requestUser(request);
  if (!user && process.env.NODE_ENV !== 'development')
    return json({ error: 'Sign in required' }, { status: 401 });
  const identity = user ?? {
    id: 'local-admin',
    email: 'admin@jfcars.local',
  };
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid request body' }, { status: 400 });
  }
  const profileInput =
    body.profile && typeof body.profile === 'object'
      ? (body.profile as Record<string, unknown>)
      : {};
  const safeIds = (value: unknown) =>
    Array.isArray(value)
      ? Array.from(
          new Set(
            value.map(Number).filter((id) => Number.isInteger(id) && id > 0),
          ),
        ).slice(0, 200)
      : [];
  const cart = safeIds(body.cart);
  const rentalCart = safeIds(body.rentalCart);
  const saved = safeIds(body.saved);
  try {
    const db = await ensureDatabase();
    const current = await db
      .prepare(`SELECT profile FROM account_state WHERE user_id = ?`)
      .bind(identity.id)
      .first<{ profile: string }>();
    const profile = normalizeProfile(
      {
        ...parseJson<StoredProfile>(current?.profile ?? null, {}),
        ...profileInput,
      },
      identity.email.split('@')[0],
    );
    await db
      .prepare(
        `INSERT INTO account_state
         (user_id, profile, cart, rental_cart, saved, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id) DO UPDATE SET profile = excluded.profile,
         cart = excluded.cart, rental_cart = excluded.rental_cart,
         saved = excluded.saved, updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        identity.id,
        JSON.stringify(profile),
        JSON.stringify(cart),
        JSON.stringify(rentalCart),
        JSON.stringify(saved),
      )
      .run();
    return json({ ok: true, user: { ...profile, email: identity.email } });
  } catch {
    return json({ error: 'Account service unavailable' }, { status: 503 });
  }
}
