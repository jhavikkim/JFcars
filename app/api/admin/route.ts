import { ensureDatabase, isAdminRequest, json, parseJson } from '@/lib/site-db';
import { loadServerCatalog } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!isAdminRequest(request))
    return json({ error: 'Admin authorization required' }, { status: 403 });
  try {
    const db = await ensureDatabase();
    const result = await db
      .prepare(
        `SELECT id, email, items, total, status, created_at
         FROM orders ORDER BY created_at DESC LIMIT 500`,
      )
      .all<{
        id: string;
        email: string;
        items: string;
        total: number;
        status: string;
        created_at: string;
      }>();
    return json({
      orders: result.results.map((row) => ({
        id: row.id,
        email: row.email,
        items: parseJson<unknown[]>(row.items, []),
        total: row.total,
        status: row.status,
        createdAt: row.created_at,
      })),
    });
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
      const row = await db
        .prepare(
          `SELECT payload FROM sell_requests
           WHERE id = ? AND status = 'Pending'`,
        )
        .bind(id)
        .first<{ payload: string }>();
      if (!row)
        return json(
          { error: 'Seller request is unavailable' },
          { status: 404 },
        );
      const payload = parseJson<Record<string, unknown>>(row.payload, {});
      const car = {
        ...payload,
        hidden: false,
        badge: 'New listing',
      };
      const catalog = await loadServerCatalog(db);
      const inventory = [
        car,
        ...catalog.filter((item) => item.id !== Number(payload.id)),
      ];
      await db.batch([
        db
          .prepare(
            `INSERT INTO marketplace_state
             (id, inventory, part_requests, seller_inquiries, storefront_content)
             VALUES (1, ?, '[]', '[]', '{}')
             ON CONFLICT(id) DO UPDATE SET inventory = excluded.inventory,
             updated_at = CURRENT_TIMESTAMP`,
          )
          .bind(JSON.stringify(inventory)),
        db
          .prepare(`UPDATE sell_requests SET status = 'Accepted' WHERE id = ?`)
          .bind(id),
      ]);
      return json({ ok: true, car });
    }
    return json({ error: 'Unknown admin action' }, { status: 400 });
  } catch {
    return json({ error: 'Admin service unavailable' }, { status: 503 });
  }
}
