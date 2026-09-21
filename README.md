# JFcars

JFcars is a multilingual vehicle marketplace for Central African markets. It
supports buying, local rentals, parts requests, shipment updates, account
management, and an authenticated admin workspace.

## Development

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm test
npm run build
```

Generate a new append-only database migration after changing `db/schema.ts`:

```bash
npm run db:generate
```

Never edit an already-deployed migration. Add a new one instead.

## Frontend structure

- `app/page.tsx` is the route-level entry point.
- `components/jfcars/JFCarsApp.tsx` owns cross-feature state, URL state, and
  remote hydration.
- `components/jfcars/media.tsx` contains the hero, information pages, and
  shipping gallery.
- `components/jfcars/marketplace-panels.tsx` contains filters, brand UI, parts,
  and seller/contact panels.
- `components/jfcars/account.tsx` contains authentication, cart, checkout, and
  profile experiences.
- `components/jfcars/vehicle.tsx` contains vehicle details, recommendations,
  and comparison.
- `components/jfcars/admin.tsx` contains the authenticated admin workspace.
- `components/jfcars/config.ts` contains seed content, translations, and pure
  display helpers.
- `lib/marketplace/types.ts` is the shared client/server contract.

## Persistence

`drizzle/0000_jfcars_marketplace.sql` is the legacy baseline. Migration `0001`
adds normalized vehicle/media, storefront translation/gallery, user-list,
order-item, and seller-request tables with foreign keys and indexes. Migration
`0002` preserves the original vehicle ID in order history even after a listing
is removed.

`lib/marketplace-store.ts` is the canonical repository. On first access after
deployment, it performs an idempotent, DML-only backfill from the old JSON
columns and records four markers in `data_migrations`. Reads then come only from
the normalized tables. Legacy JSON is mirrored for one release so a rollback
does not lose new admin or account changes.

The runtime backfill and bulk admin writes use bounded, set-based D1 queries.
The test suite replays every migration and exercises backfill idempotency,
explicitly empty inventory, malformed legacy records, transactional rollbacks,
storefront round-trips, and high-volume order-history reads in Miniflare.
