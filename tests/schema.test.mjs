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
