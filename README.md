# JFcars

JFcars is a multilingual vehicle marketplace for Central African markets. It
supports buying, local rentals, parts requests, shipment updates, account
management, and an authenticated admin workspace.

## Docker deployment

Docker Compose builds the application once and runs the compiled worker. It
applies every D1 migration before startup and persists the local D1/R2 state in
named volumes. Copy `.env.example` to `.env`, then start the service:

```bash
cp .env.example .env
docker compose up --build
```

Before accepting registrations, configure transactional email in `.env`:

```dotenv
JFCARS_PUBLIC_URL=https://jfcars.4rbl.com
RESEND_API_KEY=re_your_server_key
JFCARS_FROM_EMAIL=JFcars <verify@jfcars.4rbl.com>
```

Verify the sender domain with the email provider. Never commit `.env`; Docker
Compose supplies these values to the worker at runtime. Registration fails
closed if delivery is unavailable, and the incomplete account is removed so
the visitor can retry.

Open <http://127.0.0.1:3010>. The port is loopback-only so public traffic must
arrive through Nginx or another reverse proxy. Stop the stack with
`docker compose down`. Add `-v` only when you intentionally want to erase the
local database, uploaded media, and other Miniflare state.

For server updates, pull the new revision and rebuild without deleting the
named volume:

```bash
git pull --ff-only origin main
docker compose up -d --build
```

The production container serves prebuilt assets and does not run Vite HMR or
compile pages on demand. Bundled images are served directly instead of through
the framework image-optimizer endpoint.

JFcars owns its email/password authentication and server-side sessions. New
accounts receive the customer role. After creating the owner account through
the website, promote that exact email to the administrator role on the server:

```bash
docker compose exec web npm exec -- wrangler d1 execute site-creator-d1 \
  --local --persist-to /app/.wrangler/state --config wrangler.local.jsonc \
  --command "UPDATE auth_users SET role='admin' WHERE email='owner@example.com';"
```

Replace `owner@example.com` with the normalized owner email. Reload the site;
the existing session reads the updated role immediately. There is no local or
development administrator shortcut.

## Development

Run the live development server directly on a development workstation:

```bash
npm install
npm run db:local:migrate
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

The database diagram, table ownership, constraints, runtime bindings, and
planned eBuy persistence boundary are documented in
[`docs/database-architecture.md`](docs/database-architecture.md).

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

Migration `0008` adds first-party users and hashed server-side sessions.
Migration `0009` adds mandatory email verification for new accounts, with
one-time token digests and a 60-minute expiry. Existing accounts are marked as
verified during migration. Raw passwords, session tokens, and verification
tokens are never stored in the database.
