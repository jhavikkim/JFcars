import { ensureDatabase, json, requestUser } from '@/lib/site-db';
import {
  ensureNormalizedData,
  readAccountState,
  readOrders,
  saveAccountState,
} from '@/lib/marketplace-store';

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
    await ensureNormalizedData(db);
    const [state, orders] = await Promise.all([
      readAccountState(db, identity.id),
      readOrders(db, identity.id),
    ]);
    const partCount = await db
      .prepare(`SELECT COUNT(*) AS count FROM part_requests WHERE user_id = ?`)
      .bind(identity.id)
      .first<{ count: number }>();
    const profile = normalizeProfile(
      state.profile
        ? {
            name: state.profile.name,
            phone: state.profile.phone,
            country: state.profile.country,
            city: state.profile.city,
            preferredContact: state.profile.preferred_contact,
            preferredLanguage: state.profile.preferred_language,
          }
        : {},
      identity.name,
    );
    return json({
      user: {
        ...profile,
        email: identity.email,
      },
      cart: state.cart,
      rentalCart: state.rentalCart,
      saved: state.saved,
      partRequestCount: Number(partCount?.count || 0),
      orders,
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
    await ensureNormalizedData(db);
    const current = await readAccountState(db, identity.id);
    const profile = normalizeProfile(
      {
        ...(current.profile
          ? {
              name: current.profile.name,
              phone: current.profile.phone,
              country: current.profile.country,
              city: current.profile.city,
              preferredContact: current.profile.preferred_contact,
              preferredLanguage: current.profile.preferred_language,
            }
          : {}),
        ...profileInput,
      },
      identity.email.split('@')[0],
    );
    await saveAccountState(db, identity.id, profile, {
      cart,
      rentalCart,
      saved,
    });
    return json({ ok: true, user: { ...profile, email: identity.email } });
  } catch {
    return json({ error: 'Account service unavailable' }, { status: 503 });
  }
}
