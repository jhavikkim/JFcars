import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

export const marketplaceState = sqliteTable(
  'marketplace_state',
  {
    id: integer('id').primaryKey(),
    inventory: text('inventory'),
    partRequests: text('part_requests').notNull().default('[]'),
    sellerInquiries: text('seller_inquiries').notNull().default('[]'),
    storefrontContent: text('storefront_content').notNull().default('{}'),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [check('marketplace_singleton_check', sql`${table.id} = 1`)],
);

export const accountState = sqliteTable('account_state', {
  userId: text('user_id').primaryKey(),
  profile: text('profile').notNull().default('{}'),
  cart: text('cart').notNull().default('[]'),
  rentalCart: text('rental_cart').notNull().default('[]'),
  saved: text('saved').notNull().default('[]'),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const orders = sqliteTable(
  'orders',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    email: text('email').notNull(),
    items: text('items').notNull(),
    total: integer('total').notNull(),
    status: text('status').notNull().default('New'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index('orders_user_id_idx').on(table.userId)],
);

export const partRequests = sqliteTable(
  'part_requests',
  {
    id: text('id').primaryKey(),
    userId: text('user_id'),
    vehicle: text('vehicle').notNull(),
    part: text('part').notNull(),
    condition: text('condition').notNull(),
    delivery: text('delivery').notNull(),
    details: text('details').notNull().default(''),
    status: text('status').notNull().default('Open'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index('part_requests_user_id_idx').on(table.userId)],
);

export const sellerInquiries = sqliteTable('seller_inquiries', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  carId: integer('car_id').notNull(),
  customer: text('customer').notNull(),
  phone: text('phone').notNull(),
  message: text('message').notNull().default(''),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const sellRequests = sqliteTable('sell_requests', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  payload: text('payload').notNull(),
  status: text('status').notNull().default('Pending'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const requestLimits = sqliteTable('request_limits', {
  key: text('key').primaryKey(),
  windowStart: integer('window_start').notNull(),
  count: integer('count').notNull().default(0),
});
