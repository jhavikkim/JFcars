import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

// Legacy tables remain for a transition release. Runtime reads use the
// normalized tables after an idempotent DML-only backfill.
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
  (table) => [
    index('orders_user_id_idx').on(table.userId),
    index('orders_status_created_idx').on(table.status, table.createdAt),
  ],
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
  (table) => [
    index('part_requests_user_id_idx').on(table.userId),
    index('part_requests_status_created_idx').on(table.status, table.createdAt),
  ],
);

export const sellerInquiries = sqliteTable(
  'seller_inquiries',
  {
    id: text('id').primaryKey(),
    userId: text('user_id'),
    carId: integer('car_id').notNull(),
    customer: text('customer').notNull(),
    phone: text('phone').notNull(),
    message: text('message').notNull().default(''),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('seller_inquiries_car_created_idx').on(table.carId, table.createdAt),
  ],
);

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

export const vehicles = sqliteTable(
  'vehicles',
  {
    id: integer('id').primaryKey(),
    make: text('make').notNull(),
    model: text('model').notNull(),
    year: integer('year').notNull(),
    price: integer('price').notNull(),
    mileageKm: integer('mileage_km').notNull(),
    fuel: text('fuel').notNull(),
    body: text('body').notNull(),
    badge: text('badge').notNull().default(''),
    color: text('color'),
    transmission: text('transmission'),
    drivetrain: text('drivetrain'),
    doors: integer('doors'),
    seats: integer('seats'),
    origin: text('origin').notNull().default('local'),
    country: text('country'),
    city: text('city'),
    importRegion: text('import_region'),
    engineLitres: real('engine_litres'),
    sellerType: text('seller_type'),
    verified: integer('verified', { mode: 'boolean' }).notNull().default(false),
    available: integer('available', { mode: 'boolean' })
      .notNull()
      .default(true),
    hidden: integer('hidden', { mode: 'boolean' }).notNull().default(false),
    sample: integer('sample', { mode: 'boolean' }).notNull().default(false),
    rentable: integer('rentable', { mode: 'boolean' }).notNull().default(false),
    listedDaysAgo: integer('listed_days_ago').notNull().default(0),
    dailyRate: integer('daily_rate'),
    sortPosition: integer('sort_position').notNull().default(0),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    check('vehicles_origin_check', sql`${table.origin} IN ('local', 'abroad')`),
    check(
      'vehicles_import_region_check',
      sql`${table.importRegion} IS NULL OR ${table.importRegion} IN ('Europe', 'Asia', 'America')`,
    ),
    check(
      'vehicles_seller_type_check',
      sql`${table.sellerType} IS NULL OR ${table.sellerType} IN ('Dealer', 'Private')`,
    ),
    check(
      'vehicles_location_shape_check',
      sql`(${table.origin} = 'local' AND ${table.country} IS NOT NULL AND ${table.city} IS NOT NULL AND ${table.importRegion} IS NULL)
          OR (${table.origin} = 'abroad' AND ${table.country} IS NULL AND ${table.city} IS NULL AND ${table.importRegion} IS NOT NULL AND ${table.rentable} = 0)`,
    ),
    index('vehicles_visibility_sort_idx').on(
      table.hidden,
      table.available,
      table.sortPosition,
      table.id,
    ),
    index('vehicles_make_model_idx').on(table.make, table.model),
    index('vehicles_location_idx').on(
      table.origin,
      table.country,
      table.city,
      table.importRegion,
    ),
    index('vehicles_price_year_idx').on(table.price, table.year),
  ],
);

export const vehicleMedia = sqliteTable(
  'vehicle_media',
  {
    vehicleId: integer('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    purpose: text('purpose').notNull().default('gallery'),
    position: integer('position').notNull(),
    url: text('url').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.vehicleId, table.purpose, table.position] }),
    uniqueIndex('vehicle_media_url_idx').on(
      table.vehicleId,
      table.purpose,
      table.url,
    ),
    check(
      'vehicle_media_purpose_check',
      sql`${table.purpose} IN ('card', 'gallery')`,
    ),
  ],
);

export const storefrontSettings = sqliteTable('storefront_settings', {
  id: integer('id').primaryKey(),
  heroVideoUrl: text('hero_video_url'),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const storefrontTranslations = sqliteTable(
  'storefront_translations',
  {
    locale: text('locale').primaryKey(),
    headline: text('headline').notNull().default(''),
    description: text('description').notNull().default(''),
    galleryTitle: text('gallery_title').notNull().default(''),
    galleryDescription: text('gallery_description').notNull().default(''),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    check(
      'storefront_locale_check',
      sql`${table.locale} IN ('en', 'fr', 'es')`,
    ),
  ],
);

export const galleryItems = sqliteTable(
  'gallery_items',
  {
    id: text('id').primaryKey(),
    imageUrl: text('image_url').notNull(),
    status: text('status').notNull(),
    eventDate: text('event_date').notNull().default(''),
    departureDate: text('departure_date').notNull().default(''),
    etaDate: text('eta_date').notNull().default(''),
    location: text('location').notNull().default(''),
    reference: text('reference').notNull().default(''),
    sortPosition: integer('sort_position').notNull().default(0),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    check(
      'gallery_status_check',
      sql`${table.status} IN ('ready_to_load', 'loaded', 'ready_to_ship', 'shipped_out', 'in_transit', 'arrived_unloaded', 'in_store')`,
    ),
    index('gallery_status_sort_idx').on(table.status, table.sortPosition),
  ],
);

export const galleryItemTranslations = sqliteTable(
  'gallery_item_translations',
  {
    galleryItemId: text('gallery_item_id')
      .notNull()
      .references(() => galleryItems.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    caption: text('caption').notNull().default(''),
    comment: text('comment').notNull().default(''),
  },
  (table) => [
    primaryKey({ columns: [table.galleryItemId, table.locale] }),
    check(
      'gallery_translation_locale_check',
      sql`${table.locale} IN ('en', 'fr', 'es')`,
    ),
  ],
);

export const userProfiles = sqliteTable('user_profiles', {
  userId: text('user_id').primaryKey(),
  name: text('name').notNull().default(''),
  phone: text('phone').notNull().default(''),
  country: text('country').notNull().default(''),
  city: text('city').notNull().default(''),
  preferredContact: text('preferred_contact').notNull().default(''),
  preferredLanguage: text('preferred_language').notNull().default(''),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const userVehicleLists = sqliteTable(
  'user_vehicle_lists',
  {
    userId: text('user_id')
      .notNull()
      .references(() => userProfiles.userId, { onDelete: 'cascade' }),
    vehicleId: integer('vehicle_id')
      .notNull()
      .references(() => vehicles.id, { onDelete: 'cascade' }),
    listKind: text('list_kind').notNull(),
    position: integer('position').notNull().default(0),
    addedAt: text('added_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.listKind, table.vehicleId] }),
    check(
      'user_vehicle_list_kind_check',
      sql`${table.listKind} IN ('cart', 'rental_cart', 'saved')`,
    ),
    index('user_vehicle_lists_vehicle_idx').on(table.vehicleId),
  ],
);

export const orderItems = sqliteTable(
  'order_items',
  {
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    vehicleId: integer('vehicle_id').references(() => vehicles.id, {
      onDelete: 'set null',
    }),
    vehicleSnapshotId: integer('vehicle_snapshot_id').notNull().default(0),
    vehicleName: text('vehicle_name').notNull(),
    kind: text('kind').notNull(),
    amount: integer('amount').notNull(),
    rentalStart: text('rental_start'),
    rentalEnd: text('rental_end'),
    rentalDays: integer('rental_days'),
    pickup: text('pickup'),
  },
  (table) => [
    primaryKey({ columns: [table.orderId, table.position] }),
    check('order_items_kind_check', sql`${table.kind} IN ('buy', 'rent')`),
    index('order_items_vehicle_idx').on(table.vehicleId),
  ],
);

export const sellRequestDetails = sqliteTable('sell_request_details', {
  requestId: text('request_id')
    .primaryKey()
    .references(() => sellRequests.id, { onDelete: 'cascade' }),
  vehicleId: integer('vehicle_id').notNull(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  year: integer('year').notNull(),
  price: integer('price').notNull(),
  mileageKm: integer('mileage_km').notNull(),
  fuel: text('fuel').notNull(),
  body: text('body').notNull(),
  origin: text('origin').notNull(),
  country: text('country'),
  city: text('city'),
  importRegion: text('import_region'),
  engineLitres: real('engine_litres'),
  sellerType: text('seller_type').notNull().default('Private'),
  color: text('color'),
  transmission: text('transmission'),
  drivetrain: text('drivetrain'),
  doors: integer('doors'),
  seats: integer('seats'),
  badge: text('badge').notNull().default('Pending review'),
  verified: integer('verified', { mode: 'boolean' }).notNull().default(false),
  available: integer('available', { mode: 'boolean' }).notNull().default(true),
  hidden: integer('hidden', { mode: 'boolean' }).notNull().default(true),
  sample: integer('sample', { mode: 'boolean' }).notNull().default(false),
  listedDaysAgo: integer('listed_days_ago').notNull().default(0),
});

export const sellRequestMedia = sqliteTable(
  'sell_request_media',
  {
    requestId: text('request_id')
      .notNull()
      .references(() => sellRequests.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    url: text('url').notNull(),
  },
  (table) => [primaryKey({ columns: [table.requestId, table.position] })],
);

export const dataMigrations = sqliteTable('data_migrations', {
  name: text('name').primaryKey(),
  completedAt: text('completed_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
