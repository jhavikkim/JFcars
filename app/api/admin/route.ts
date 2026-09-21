import { ensureDatabase, isAdminRequest, json } from '@/lib/site-db';
import {
  acceptSellRequest,
  ensureNormalizedData,
  readOrders,
} from '@/lib/marketplace-store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isAdminRequest(request))
    return json({ error: 'Admin authorization required' }, { status: 403 });
  try {
    const db = await ensureDatabase();
    await ensureNormalizedData(db);
    return json({ orders: await readOrders(db) });
  } catch {
    return json({ error: 'Admin service unavailable' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request))
    return json({ error: 'Admin authorization required' }, { status: 403 });
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: 'Invalid request body' }, { status: 400 });
  }
  const id = typeof body.id === 'string' ? body.id : '';
  const status = typeof body.status === 'string' ? body.status : '';
  const action = typeof body.action === 'string' ? body.action : 'order-status';
  if (!id) return json({ error: 'Missing record id' }, { status: 400 });
  try {
    const db = await ensureDatabase();
    await ensureNormalizedData(db);
    if (action === 'order-status') {
      if (!['New', 'Contacted', 'Complete', 'Cancelled'].includes(status))
        return json({ error: 'Invalid order update' }, { status: 400 });
      await db
        .prepare(`UPDATE orders SET status = ? WHERE id = ?`)
        .bind(status, id)
        .run();
      return json({ ok: true });
    }
    if (action === 'part-status') {
      if (!['Open', 'In progress', 'Complete'].includes(status))
        return json({ error: 'Invalid part request update' }, { status: 400 });
      await db
        .prepare(`UPDATE part_requests SET status = ? WHERE id = ?`)
        .bind(status, id)
        .run();
      return json({ ok: true });
    }
    if (action === 'part-archive') {
      await db.prepare(`DELETE FROM part_requests WHERE id = ?`).bind(id).run();
      return json({ ok: true });
    }
    if (action === 'inquiry-archive') {
      await db
        .prepare(`DELETE FROM seller_inquiries WHERE id = ?`)
        .bind(id)
        .run();
      return json({ ok: true });
    }
    if (action === 'sell-reject') {
      await db
        .prepare(`UPDATE sell_requests SET status = 'Rejected' WHERE id = ?`)
        .bind(id)
        .run();
      return json({ ok: true });
    }
    if (action === 'sell-accept') {
      const car = await acceptSellRequest(db, id);
      if (!car)
        return json(
          { error: 'Seller request is unavailable' },
          { status: 404 },
        );
      return json({ ok: true, car });
    }
    return json({ error: 'Unknown admin action' }, { status: 400 });
  } catch {
    return json({ error: 'Admin service unavailable' }, { status: 503 });
  }
}
