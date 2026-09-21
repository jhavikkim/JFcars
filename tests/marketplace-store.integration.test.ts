import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { Miniflare } from 'miniflare';

import {
  createOrder,
  createSellRequest,
  ensureNormalizedData,
  readAccountState,
  readOrders,
  readSellRequests,
  readStorefrontContent,
  readVehicles,
  replaceMarketplace,
  saveAccountState,
} from '../lib/marketplace-store';
import type { Car } from '../lib/marketplace/types';

const migrations = [
  '0000_jfcars_marketplace.sql',
  '0001_light_magneto.sql',
  '0002_brave_nova.sql',
  '0003_fearless_genesis.sql',
];

async function applyMigrations(db: D1Database, names: string[]) {
  for (const name of names) {
    const sql = readFileSync(
      new URL(`../drizzle/${name}`, import.meta.url),
      'utf8',
    );
    const statements = sql
      .split('--> statement-breakpoint')
      .map((statement) => statement.trim())
      .filter(Boolean)
      .map((statement) => db.prepare(statement));
    if (statements.length) await db.batch(statements);
  }
}

async function emptyDatabase() {
  const mf = new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response("ok") } }',
    d1Databases: { DB: `test-${crypto.randomUUID()}` },
  });
  const db = await mf.getD1Database('DB');
  return { db, dispose: () => mf.dispose() };
}

async function database() {
  const instance = await emptyDatabase();
  try {
    await applyMigrations(instance.db, migrations);
  } catch (error) {
    await instance.dispose();
    throw error;
  }
  return instance;
}

const validCar = (id = 901): Car => ({
  id,
  make: 'Toyota',
  model: 'Hilux',
  year: 2022,
  price: 19_000_000,
  km: 32_000,
  fuel: 'Diesel',
  body: 'Pickup',
  location: 'Douala',
  image: 'https://example.com/hilux-main.webp',
  images: [
    'https://example.com/hilux-main.webp',
    'https://example.com/hilux-side.webp',
  ],
  badge: 'Verified',
  origin: 'local',
  country: 'Cameroon',
  city: 'Douala',
  available: true,
  hidden: false,
  sample: false,
  rentable: true,
  dailyRate: 50_000,
});

void test('backfill preserves an explicitly empty inventory', async () => {
  const { db, dispose } = await database();
  try {
    await db
      .prepare(
        `INSERT INTO marketplace_state (id, inventory, storefront_content)
         VALUES (1, '[]', '{}')`,
      )
      .run();
    await ensureNormalizedData(db);
    assert.equal((await readVehicles(db, true)).length, 0);
    assert.equal(
      (
        await db
          .prepare(
            `SELECT COUNT(*) AS count FROM data_migrations
             WHERE name = 'marketplace_v1'`,
          )
          .first<{ count: number }>()
      )?.count,
      1,
    );
  } finally {
    await dispose();
  }
});

void test('backfill keeps valid legacy cars and skips malformed records', async () => {
  const { db, dispose } = await database();
  try {
    await db
      .prepare(
        `INSERT INTO marketplace_state (id, inventory, storefront_content)
         VALUES (1, ?, '{}')`,
      )
      .bind(JSON.stringify([validCar(), null, {}, { id: 2, year: 1800 }]))
      .run();
    await ensureNormalizedData(db);
    const cars = await readVehicles(db, true);
    assert.equal(cars.length, 1);
    assert.equal(cars[0]?.id, 901);
    assert.deepEqual(cars[0]?.images, [
      'https://example.com/hilux-main.webp',
      'https://example.com/hilux-side.webp',
    ]);
  } finally {
    await dispose();
  }
});

void test('legacy account, order, and seller data backfills idempotently', async () => {
  const { db, dispose } = await database();
  try {
    const car = validCar();
    const sellerCar = validCar(902);
    await db.batch([
      db
        .prepare(
          `INSERT INTO marketplace_state (id, inventory, storefront_content)
           VALUES (1, ?, '{}')`,
        )
        .bind(JSON.stringify([car])),
      db
        .prepare(
          `INSERT INTO account_state
           (user_id, profile, cart, rental_cart, saved)
           VALUES ('user-1', ?, '[901]', '[]', '[901]')`,
        )
        .bind(
          JSON.stringify({
            name: 'Ada Buyer',
            country: 'Cameroon',
            city: 'Douala',
            preferredContact: 'WhatsApp',
            preferredLanguage: 'pt',
            preferredCurrency: 'AOA',
          }),
        ),
      db
        .prepare(
          `INSERT INTO orders (id, user_id, email, items, total)
           VALUES ('legacy-order', 'user-1', 'ada@example.com', ?, 19000000)`,
        )
        .bind(
          JSON.stringify([
            {
              carId: 901,
              vehicle: 'Toyota Hilux',
              kind: 'buy',
              amount: 19_000_000,
            },
          ]),
        ),
      db
        .prepare(
          `INSERT INTO sell_requests (id, user_id, payload, status)
           VALUES ('legacy-sell', 'user-1', ?, 'Pending')`,
        )
        .bind(JSON.stringify(sellerCar)),
    ]);

    await ensureNormalizedData(db);
    await ensureNormalizedData(db);

    const count = async (table: string) =>
      Number(
        (
          await db
            .prepare(`SELECT COUNT(*) AS count FROM ${table}`)
            .first<{ count: number }>()
        )?.count || 0,
      );
    assert.equal(await count('data_migrations'), 4);
    assert.equal(await count('user_profiles'), 1);
    assert.equal(await count('user_vehicle_lists'), 2);
    assert.equal(await count('order_items'), 1);
    assert.equal(await count('sell_request_details'), 1);
    assert.equal(await count('sell_request_media'), 2);

    const account = await readAccountState(db, 'user-1');
    assert.equal(account.profile?.preferred_language, 'pt');
    assert.equal(account.profile?.preferred_currency, 'AOA');

    const orders = await readOrders(db, 'user-1');
    assert.equal(orders[0]?.items[0]?.carId, 901);
    const sellRequests = await readSellRequests(db);
    assert.equal(sellRequests[0]?.car.id, 902);
    assert.equal(sellRequests[0]?.car.images?.length, 2);
  } finally {
    await dispose();
  }
});

void test('normalized storefront content and gallery round-trip', async () => {
  const { db, dispose } = await database();
  try {
    await replaceMarketplace(db, [validCar()], {
      heroVideo: 'https://example.com/hero.mp4',
      en: {
        headline: 'Cars for Central Africa',
        description: 'Clear inventory and shipment updates.',
        galleryTitle: 'Latest shipment',
        galleryDescription: 'Real photos from our team.',
      },
      pt: {
        headline: 'Automóveis para a África Central',
        description: 'Inventário claro e atualizações de envio.',
        galleryTitle: 'Último envio',
        galleryDescription: 'Fotografias reais da nossa equipa.',
      },
      gallery: [
        {
          id: 'load-1',
          image: 'https://example.com/load.webp',
          status: 'ready_to_ship',
          date: '2026-09-21',
          location: 'Antwerp',
          reference: 'JF-LOAD-1',
          captions: {
            en: 'Ready to ship',
            fr: 'Prêt à expédier',
            pt: 'Pronto para envio',
          },
          comments: {
            en: 'Container checked',
            fr: 'Conteneur vérifié',
            pt: 'Contentor verificado',
          },
        },
      ],
    });
    const content = await readStorefrontContent(db);
    assert.equal(content.heroVideo, 'https://example.com/hero.mp4');
    assert.equal(content.en?.headline, 'Cars for Central Africa');
    assert.equal(content.pt?.headline, 'Automóveis para a África Central');
    assert.equal(content.gallery?.[0]?.captions.fr, 'Prêt à expédier');
    assert.equal(content.gallery?.[0]?.captions.pt, 'Pronto para envio');
    assert.equal((await readVehicles(db, true)).length, 1);
  } finally {
    await dispose();
  }
});

void test('account preferences persist Portuguese and currency safely', async () => {
  const { db, dispose } = await database();
  try {
    await ensureNormalizedData(db);
    await saveAccountState(
      db,
      'user-settings',
      {
        name: 'Ana Cabinda',
        preferredLanguage: 'pt',
        preferredCurrency: 'AOA',
      },
      { cart: [], rentalCart: [], saved: [] },
    );
    let account = await readAccountState(db, 'user-settings');
    assert.equal(account.profile?.preferred_language, 'pt');
    assert.equal(account.profile?.preferred_currency, 'AOA');

    await saveAccountState(
      db,
      'user-settings',
      {
        name: 'Ana Cabinda',
        preferredLanguage: 'de',
        preferredCurrency: 'BTC',
      },
      { cart: [], rentalCart: [], saved: [] },
    );
    account = await readAccountState(db, 'user-settings');
    assert.equal(account.profile?.preferred_language, '');
    assert.equal(account.profile?.preferred_currency, 'XAF');
  } finally {
    await dispose();
  }
});

void test('currency migration preserves existing D1 account lists', async () => {
  const { db, dispose } = await emptyDatabase();
  try {
    await applyMigrations(db, migrations.slice(0, 3));
    await db.batch([
      db.prepare(
        `INSERT INTO vehicles
         (id, make, model, year, price, mileage_km, fuel, body, origin,
          country, city, import_region, rentable)
         VALUES
         (42, 'Toyota', 'Hilux', 2022, 19000000, 32000, 'Diesel',
          'Pickup', 'local', 'Angola', 'Cabinda', NULL, 0)`,
      ),
      db.prepare(
        `INSERT INTO user_profiles (user_id, name, preferred_language)
         VALUES ('existing-user', 'Ana', 'pt')`,
      ),
      db.prepare(
        `INSERT INTO user_vehicle_lists
         (user_id, vehicle_id, list_kind)
         VALUES ('existing-user', 42, 'saved')`,
      ),
    ]);
    await applyMigrations(db, migrations.slice(3));
    const account = await readAccountState(db, 'existing-user');
    assert.equal(account.profile?.preferred_language, 'pt');
    assert.equal(account.profile?.preferred_currency, 'XAF');
    assert.deepEqual(account.saved, [42]);
  } finally {
    await dispose();
  }
});

void test('order parent rolls back when a child write fails', async () => {
  const { db, dispose } = await database();
  try {
    await ensureNormalizedData(db);
    await db
      .prepare(
        `CREATE TRIGGER reject_order_item
         BEFORE INSERT ON order_items
         BEGIN SELECT RAISE(ABORT, 'forced order item failure'); END`,
      )
      .run();
    await assert.rejects(
      createOrder(db, {
        id: 'order-rollback',
        userId: 'user-1',
        email: 'buyer@example.com',
        items: [
          {
            carId: 1,
            vehicle: 'Volvo XC40 Recharge',
            kind: 'buy',
            amount: 25_500_000,
          },
        ],
        total: 25_500_000,
      }),
    );
    assert.equal(
      (
        await db
          .prepare(`SELECT COUNT(*) AS count FROM orders`)
          .first<{ count: number }>()
      )?.count,
      0,
    );
  } finally {
    await dispose();
  }
});

void test('seller-request parent rolls back when normalized details fail', async () => {
  const { db, dispose } = await database();
  try {
    await ensureNormalizedData(db);
    await db
      .prepare(
        `CREATE TRIGGER reject_sell_details
         BEFORE INSERT ON sell_request_details
         BEGIN SELECT RAISE(ABORT, 'forced sell detail failure'); END`,
      )
      .run();
    await assert.rejects(
      createSellRequest(db, 'sell-rollback', 'user-1', validCar(902)),
    );
    assert.equal(
      (
        await db
          .prepare(`SELECT COUNT(*) AS count FROM sell_requests`)
          .first<{ count: number }>()
      )?.count,
      0,
    );
  } finally {
    await dispose();
  }
});

void test('order reads include every item from the latest 500 orders', async () => {
  const { db, dispose } = await database();
  try {
    await db.batch([
      db.prepare(
        `INSERT INTO vehicles
        (id, make, model, year, price, mileage_km, fuel, body, origin,
         country, city, import_region, rentable)
         VALUES
        (1, 'Toyota', 'Hilux', 2022, 19000000, 32000, 'Diesel', 'Pickup',
         'local', 'Cameroon', 'Douala', NULL, 0)`,
      ),
      db.prepare(
        `WITH RECURSIVE order_number(value) AS (
        SELECT 1 UNION ALL SELECT value + 1 FROM order_number WHERE value < 501
         )
         INSERT INTO orders (id, user_id, email, items, total, created_at)
         SELECT printf('order-%03d', value), 'user-1', 'buyer@example.com',
                '[]', 380000000,
                datetime('2026-01-01', printf('+%d seconds', value))
         FROM order_number`,
      ),
      db.prepare(
        `WITH RECURSIVE order_number(value) AS (
        SELECT 1 UNION ALL SELECT value + 1 FROM order_number WHERE value < 501
         ), item_number(value) AS (
        SELECT 0 UNION ALL SELECT value + 1 FROM item_number WHERE value < 19
         )
         INSERT INTO order_items
        (order_id, position, vehicle_id, vehicle_snapshot_id, vehicle_name,
         kind, amount)
         SELECT printf('order-%03d', order_number.value), item_number.value,
                1, 1, 'Toyota Hilux', 'buy', 19000000
         FROM order_number CROSS JOIN item_number`,
      ),
    ]);
    const orders = await readOrders(db);
    assert.equal(orders.length, 500);
    assert.equal(orders[0]?.id, 'order-501');
    assert.equal(orders[0]?.items.length, 20);
    assert.equal(orders.at(-1)?.id, 'order-002');
    assert.ok(orders.every((order) => order.items.length === 20));
  } finally {
    await dispose();
  }
});
