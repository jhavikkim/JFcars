import { ensureDatabase, isAdminRequest, json } from '@/lib/site-db';
import {
  acceptSellRequest,
  ensureNormalizedData,
  MarketplaceRevisionConflictError,
  readOrders,
} from '@/lib/marketplace-store';
import { readJsonObject } from '@/lib/request-body';
import { VEHICLE_SELLING_ENABLED } from '@/components/jfcars/config';

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
  const parsed = await readJsonObject(request, 20_000);
  if (!parsed.ok)
    return json({ error: parsed.error }, { status: parsed.status });
  const body = parsed.value;
  const id = typeof body.id === 'string' ? body.id : '';
  const status = typeof body.status === 'string' ? body.status : '';
  const action = typeof body.action === 'string' ? body.action : 'order-status';
  if (!id) return json({ error: 'Missing record id' }, { status: 400 });
  if (
    !VEHICLE_SELLING_ENABLED &&
    (action === 'sell-accept' || action === 'sell-reject')
  )
    return json({ error: 'Vehicle selling is not available' }, { status: 403 });
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
      const result = await db
        .prepare(
          `UPDATE sell_requests SET status = 'Rejected'
           WHERE id = ? AND status = 'Pending'`,
        )
        .bind(id)
        .run();
      if (!result.meta.changes)
        return json(
          { error: 'Seller request is unavailable' },
          { status: 404 },
        );
      return json({ ok: true });
    }
    if (action === 'sell-accept') {
      const accepted = await acceptSellRequest(db, id);
      if (!accepted)
        return json(
          { error: 'Seller request is unavailable' },
          { status: 404 },
        );
      return json({ ok: true, ...accepted });
    }
    return json({ error: 'Unknown admin action' }, { status: 400 });
  } catch (error) {
    if (error instanceof MarketplaceRevisionConflictError)
      return json(
        {
          error: 'Marketplace data changed. Reload before saving again.',
          currentRevision: error.currentRevision,
        },
        { status: 409 },
      );
    return json({ error: 'Admin service unavailable' }, { status: 503 });
  }
}
