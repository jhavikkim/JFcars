import { ensureDatabase, json, requestUser } from '@/lib/site-db';
import { loadServerCatalog } from '@/lib/catalog';
import { createOrder } from '@/lib/marketplace-store';
import type { OrderItem } from '@/lib/marketplace/types';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = requestUser(request);
  if (!user && process.env.NODE_ENV !== 'development')
    return json({ error: 'Sign in required' }, { status: 401 });
  const identity = user ?? {
    id: 'local-admin',
    email: 'admin@jfcars.local',
  };
  let body: Record<string, unknown>;
  if (Number(request.headers.get('content-length') || 0) > 50_000)
    return json({ error: 'Request is too large' }, { status: 413 });
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid request body' }, { status: 400 });
  }
  const requested = Array.isArray(body.items) ? body.items.slice(0, 20) : [];
  if (!requested.length)
    return json({ error: 'Order is empty' }, { status: 400 });
  const rentalDetails =
    body.rentalDetails && typeof body.rentalDetails === 'object'
      ? (body.rentalDetails as Record<string, unknown>)
      : null;
  const rentalStart =
    typeof rentalDetails?.startDate === 'string' ? rentalDetails.startDate : '';
  const rentalEnd =
    typeof rentalDetails?.endDate === 'string' ? rentalDetails.endDate : '';
  const rentalDayCount =
    /^\d{4}-\d{2}-\d{2}$/.test(rentalStart) &&
    /^\d{4}-\d{2}-\d{2}$/.test(rentalEnd)
      ? Math.ceil(
          (Date.parse(`${rentalEnd}T00:00:00Z`) -
            Date.parse(`${rentalStart}T00:00:00Z`)) /
            86_400_000,
        )
      : 0;
  const requestsRental = requested.some(
    (value) =>
      value &&
      typeof value === 'object' &&
      (value as Record<string, unknown>).kind === 'rent',
  );
  const today = new Date().toISOString().slice(0, 10);
  if (
    requestsRental &&
    (rentalDetails?.termsAccepted !== true ||
      rentalStart < today ||
      !Number.isFinite(rentalDayCount) ||
      rentalDayCount < 1 ||
      rentalDayCount > 60)
  )
    return json(
      { error: 'Valid rental details are required' },
      { status: 400 },
    );
  const id = crypto.randomUUID();
  try {
    const db = await ensureDatabase();
    const catalog = await loadServerCatalog(db);
    const seen = new Set<string>();
    const items = requested.flatMap((value) => {
      if (!value || typeof value !== 'object') return [];
      const requestedItem = value as Record<string, unknown>;
      const carId = Math.round(Number(requestedItem.carId));
      const kind: OrderItem['kind'] =
        requestedItem.kind === 'rent' ? 'rent' : 'buy';
      const key = `${carId}:${kind}`;
      if (!Number.isFinite(carId) || seen.has(key)) return [];
      const car = catalog.find(
        (item) => item.id === carId && !item.hidden && item.available !== false,
      );
      if (!car || !Number.isFinite(car.price) || car.price <= 0) return [];
      if (
        kind === 'rent' &&
        (car.origin !== 'local' ||
          car.rentable !== true ||
          !Number.isFinite(car.dailyRate) ||
          Number(car.dailyRate) <= 0)
      )
        return [];
      seen.add(key);
      return [
        {
          carId,
          vehicle: `${car.make} ${car.model}`,
          kind,
          amount:
            kind === 'rent'
              ? Math.round(Number(car.dailyRate)) * rentalDayCount
              : Math.round(Number(car.price)),
          ...(kind === 'rent'
            ? {
                rentalStart,
                rentalEnd,
                rentalDays: rentalDayCount,
                pickup: car.city || car.location || 'Local pickup',
              }
            : {}),
        },
      ];
    });
    if (!items.length || items.length !== requested.length)
      return json(
        { error: 'One or more listings are unavailable' },
        { status: 409 },
      );
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    await createOrder(db, {
      id,
      userId: identity.id,
      email: identity.email,
      items,
      total,
    });
    return json({ ok: true, orderId: id, items, total });
  } catch {
    return json({ error: 'Order service unavailable' }, { status: 503 });
  }
}
