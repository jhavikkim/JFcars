import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';

const migration = (name) =>
  readFileSync(new URL(`../drizzle/${name}`, import.meta.url), 'utf8');

const migratedDatabase = () => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(migration('0000_jfcars_marketplace.sql'));
  db.exec(migration('0001_light_magneto.sql'));
  db.exec(migration('0002_brave_nova.sql'));
  db.exec(migration('0003_fearless_genesis.sql'));
  db.exec(migration('0004_marketplace_sync_contacts.sql'));
  return db;
};

test('legacy and normalized migrations apply cleanly', () => {
  const db = migratedDatabase();
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`,
    )
    .all();
  assert.equal(tables.length, 19);
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  db.close();
});

test('marketplace revisions and part-request contacts are persisted', () => {
  const db = migratedDatabase();
  const marketplaceColumns = db
    .prepare(`PRAGMA table_info('marketplace_state')`)
    .all()
    .map((column) => column.name);
  const partColumns = db
    .prepare(`PRAGMA table_info('part_requests')`)
    .all()
    .map((column) => column.name);
  assert.ok(marketplaceColumns.includes('revision'));
  assert.ok(partColumns.includes('contact_name'));
  assert.ok(partColumns.includes('contact_email'));
  assert.ok(partColumns.includes('contact_phone'));
  db.exec(`
    INSERT INTO part_requests
      (id, vehicle, part, condition, delivery, contact_name, contact_email)
    VALUES
      ('part-1', 'Toyota Hilux', 'Headlamp', 'Any', 'Cameroon',
       'Ada Buyer', 'ada@example.com');
  `);
  assert.deepEqual(
    {
      ...db
        .prepare(
          `SELECT contact_name, contact_email, contact_phone
           FROM part_requests WHERE id = 'part-1'`,
        )
        .get(),
    },
    {
      contact_name: 'Ada Buyer',
      contact_email: 'ada@example.com',
      contact_phone: '',
    },
  );
  db.close();
});

test('vehicle location constraints distinguish local and abroad stock', () => {
  const db = migratedDatabase();
  const insert = db.prepare(
    `INSERT INTO vehicles
     (id, make, model, year, price, mileage_km, fuel, body, origin,
      country, city, import_region, rentable)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  insert.run(
    1,
    'Toyota',
    'Hilux',
    2022,
    19_000_000,
    32_000,
    'Diesel',
    'Pickup',
    'local',
    'Cameroon',
    'Douala',
    null,
    1,
  );
  insert.run(
    2,
    'BMW',
    'X3',
    2023,
    28_000_000,
    18_000,
    'Petrol',
    'SUV',
    'abroad',
    null,
    null,
    'Europe',
    0,
  );
  assert.throws(() =>
    insert.run(
      3,
      'Audi',
      'Q5',
      2021,
      24_000_000,
      44_000,
      'Diesel',
      'SUV',
      'abroad',
      'Gabon',
      'Libreville',
      'Europe',
      0,
    ),
  );
  db.close();
});

test('vehicle media cascades while order snapshots survive deletion', () => {
  const db = migratedDatabase();
  db.exec(`
    INSERT INTO vehicles
      (id, make, model, year, price, mileage_km, fuel, body, origin,
       country, city, import_region, rentable)
    VALUES
      (7, 'Toyota', 'Hilux', 2021, 19800000, 68400, 'Diesel', 'Pickup',
       'local', 'Angola', 'Cabinda', NULL, 1);
    INSERT INTO vehicle_media (vehicle_id, purpose, position, url)
    VALUES (7, 'card', 0, 'https://example.com/hilux.webp');
    INSERT INTO orders (id, user_id, email, items, total)
    VALUES ('order-1', 'user-1', 'buyer@example.com', '[]', 19800000);
    INSERT INTO order_items
      (order_id, position, vehicle_id, vehicle_snapshot_id, vehicle_name,
       kind, amount)
    VALUES ('order-1', 0, 7, 7, 'Toyota Hilux', 'buy', 19800000);
    DELETE FROM vehicles WHERE id = 7;
  `);
  assert.equal(
    db.prepare('SELECT COUNT(*) AS count FROM vehicle_media').get().count,
    0,
  );
  assert.deepEqual(
    {
      ...db
        .prepare(
          `SELECT vehicle_id, vehicle_snapshot_id, vehicle_name, amount
           FROM order_items
           WHERE order_id = 'order-1'`,
        )
        .get(),
    },
    {
      vehicle_id: null,
      vehicle_snapshot_id: 7,
      vehicle_name: 'Toyota Hilux',
      amount: 19_800_000,
    },
  );
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  db.close();
});

test('Portuguese translations and supported currencies satisfy schema constraints', () => {
  const db = migratedDatabase();
  db.exec(`
    INSERT INTO storefront_translations (locale, headline)
    VALUES ('pt', 'Automóveis para a África Central');
    INSERT INTO gallery_items
      (id, image_url, status, location, reference)
    VALUES
      ('load-pt', 'https://example.com/load.webp', 'ready_to_ship',
       'Luanda', 'JF-PT-1');
    INSERT INTO gallery_item_translations
      (gallery_item_id, locale, caption, comment)
    VALUES
      ('load-pt', 'pt', 'Pronto para envio', 'Contentor verificado');
    INSERT INTO user_profiles
      (user_id, preferred_language, preferred_currency)
    VALUES
      ('user-pt', 'pt', 'AOA'),
      ('user-default', '', 'XAF');
  `);
  assert.deepEqual(
    {
      ...db
        .prepare(
          `SELECT preferred_language, preferred_currency
           FROM user_profiles WHERE user_id = 'user-pt'`,
        )
        .get(),
    },
    { preferred_language: 'pt', preferred_currency: 'AOA' },
  );
  assert.throws(() =>
    db
      .prepare(
        `INSERT INTO user_profiles
         (user_id, preferred_language, preferred_currency)
         VALUES ('bad-language', 'de', 'XAF')`,
      )
      .run(),
  );
  assert.throws(() =>
    db
      .prepare(
        `INSERT INTO user_profiles (user_id, preferred_currency)
         VALUES ('bad-currency', 'BTC')`,
      )
      .run(),
  );
  assert.throws(() =>
    db
      .prepare(
        `INSERT INTO storefront_translations (locale, headline)
         VALUES ('de', 'Nicht unterstützt')`,
      )
      .run(),
  );
  db.close();
});

test('currency migration preserves profiles and vehicle lists', () => {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(migration('0000_jfcars_marketplace.sql'));
  db.exec(migration('0001_light_magneto.sql'));
  db.exec(migration('0002_brave_nova.sql'));
  db.exec(`
    INSERT INTO vehicles
      (id, make, model, year, price, mileage_km, fuel, body, origin,
       country, city, import_region, rentable)
    VALUES
      (8, 'Toyota', 'Hilux', 2022, 19000000, 32000, 'Diesel', 'Pickup',
       'local', 'Angola', 'Cabinda', NULL, 0);
    INSERT INTO user_profiles (user_id, name, preferred_language)
    VALUES
      ('legacy-user', 'Ana', 'fr'),
      ('legacy-invalid-language', 'Unsupported', 'de');
    INSERT INTO user_vehicle_lists (user_id, vehicle_id, list_kind)
    VALUES ('legacy-user', 8, 'saved');
  `);
  db.exec(migration('0003_fearless_genesis.sql'));
  db.exec(migration('0004_marketplace_sync_contacts.sql'));
  assert.deepEqual(
    {
      ...db
        .prepare(
          `SELECT name, preferred_language, preferred_currency
           FROM user_profiles WHERE user_id = 'legacy-user'`,
        )
        .get(),
    },
    { name: 'Ana', preferred_language: 'fr', preferred_currency: 'XAF' },
  );
  assert.equal(
    db
      .prepare(
        `SELECT COUNT(*) AS count FROM user_vehicle_lists
         WHERE user_id = 'legacy-user' AND vehicle_id = 8`,
      )
      .get().count,
    1,
  );
  assert.equal(
    db
      .prepare(
        `SELECT preferred_language FROM user_profiles
         WHERE user_id = 'legacy-invalid-language'`,
      )
      .get().preferred_language,
    '',
  );
  assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
  db.close();
});
