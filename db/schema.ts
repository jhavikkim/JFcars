export const marketplaceStateSchema = `
CREATE TABLE IF NOT EXISTS marketplace_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  inventory TEXT,
  part_requests TEXT NOT NULL DEFAULT '[]',
  seller_inquiries TEXT NOT NULL DEFAULT '[]',
  storefront_content TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`;

export const accountStateSchema = `
CREATE TABLE IF NOT EXISTS account_state (
  user_id TEXT PRIMARY KEY,
  profile TEXT NOT NULL DEFAULT '{}',
  cart TEXT NOT NULL DEFAULT '[]',
  rental_cart TEXT NOT NULL DEFAULT '[]',
  saved TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`;

export const ordersSchema = `
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  items TEXT NOT NULL,
  total INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'New',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`;

export const ordersUserIndexSchema = `
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON orders (user_id)
`;

export const partRequestsSchema = `
CREATE TABLE IF NOT EXISTS part_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  vehicle TEXT NOT NULL,
  part TEXT NOT NULL,
  condition TEXT NOT NULL,
  delivery TEXT NOT NULL,
  details TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Open',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`;

export const partRequestsUserIndexSchema = `
CREATE INDEX IF NOT EXISTS part_requests_user_id_idx ON part_requests (user_id)
`;

export const sellerInquiriesSchema = `
CREATE TABLE IF NOT EXISTS seller_inquiries (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  car_id INTEGER NOT NULL,
  customer TEXT NOT NULL,
  phone TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`;

export const sellRequestsSchema = `
CREATE TABLE IF NOT EXISTS sell_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)
`;

export const requestLimitsSchema = `
CREATE TABLE IF NOT EXISTS request_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0
)
`;
