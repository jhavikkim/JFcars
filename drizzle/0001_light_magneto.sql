CREATE TABLE `data_migrations` (
	`name` text PRIMARY KEY NOT NULL,
	`completed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `gallery_item_translations` (
	`gallery_item_id` text NOT NULL,
	`locale` text NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`comment` text DEFAULT '' NOT NULL,
	PRIMARY KEY(`gallery_item_id`, `locale`),
	FOREIGN KEY (`gallery_item_id`) REFERENCES `gallery_items`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "gallery_translation_locale_check" CHECK("gallery_item_translations"."locale" IN ('en', 'fr', 'es'))
);
--> statement-breakpoint
CREATE TABLE `gallery_items` (
	`id` text PRIMARY KEY NOT NULL,
	`image_url` text NOT NULL,
	`status` text NOT NULL,
	`event_date` text DEFAULT '' NOT NULL,
	`departure_date` text DEFAULT '' NOT NULL,
	`eta_date` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`reference` text DEFAULT '' NOT NULL,
	`sort_position` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "gallery_status_check" CHECK("gallery_items"."status" IN ('ready_to_load', 'loaded', 'ready_to_ship', 'shipped_out', 'in_transit', 'arrived_unloaded', 'in_store'))
);
--> statement-breakpoint
CREATE INDEX `gallery_status_sort_idx` ON `gallery_items` (`status`,`sort_position`);--> statement-breakpoint
CREATE TABLE `order_items` (
	`order_id` text NOT NULL,
	`position` integer NOT NULL,
	`vehicle_id` integer,
	`vehicle_name` text NOT NULL,
	`kind` text NOT NULL,
	`amount` integer NOT NULL,
	`rental_start` text,
	`rental_end` text,
	`rental_days` integer,
	`pickup` text,
	PRIMARY KEY(`order_id`, `position`),
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "order_items_kind_check" CHECK("order_items"."kind" IN ('buy', 'rent'))
);
--> statement-breakpoint
CREATE INDEX `order_items_vehicle_idx` ON `order_items` (`vehicle_id`);--> statement-breakpoint
CREATE TABLE `sell_request_details` (
	`request_id` text PRIMARY KEY NOT NULL,
	`vehicle_id` integer NOT NULL,
	`make` text NOT NULL,
	`model` text NOT NULL,
	`year` integer NOT NULL,
	`price` integer NOT NULL,
	`mileage_km` integer NOT NULL,
	`fuel` text NOT NULL,
	`body` text NOT NULL,
	`origin` text NOT NULL,
	`country` text,
	`city` text,
	`import_region` text,
	`engine_litres` real,
	`seller_type` text DEFAULT 'Private' NOT NULL,
	`color` text,
	`transmission` text,
	`drivetrain` text,
	`doors` integer,
	`seats` integer,
	`badge` text DEFAULT 'Pending review' NOT NULL,
	`verified` integer DEFAULT false NOT NULL,
	`available` integer DEFAULT true NOT NULL,
	`hidden` integer DEFAULT true NOT NULL,
	`sample` integer DEFAULT false NOT NULL,
	`listed_days_ago` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`request_id`) REFERENCES `sell_requests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sell_request_media` (
	`request_id` text NOT NULL,
	`position` integer NOT NULL,
	`url` text NOT NULL,
	PRIMARY KEY(`request_id`, `position`),
	FOREIGN KEY (`request_id`) REFERENCES `sell_requests`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `storefront_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`hero_video_url` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `storefront_translations` (
	`locale` text PRIMARY KEY NOT NULL,
	`headline` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`gallery_title` text DEFAULT '' NOT NULL,
	`gallery_description` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "storefront_locale_check" CHECK("storefront_translations"."locale" IN ('en', 'fr', 'es'))
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`country` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`preferred_contact` text DEFAULT '' NOT NULL,
	`preferred_language` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_vehicle_lists` (
	`user_id` text NOT NULL,
	`vehicle_id` integer NOT NULL,
	`list_kind` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`added_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `list_kind`, `vehicle_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user_profiles`(`user_id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "user_vehicle_list_kind_check" CHECK("user_vehicle_lists"."list_kind" IN ('cart', 'rental_cart', 'saved'))
);
--> statement-breakpoint
CREATE INDEX `user_vehicle_lists_vehicle_idx` ON `user_vehicle_lists` (`vehicle_id`);--> statement-breakpoint
CREATE TABLE `vehicle_media` (
	`vehicle_id` integer NOT NULL,
	`purpose` text DEFAULT 'gallery' NOT NULL,
	`position` integer NOT NULL,
	`url` text NOT NULL,
	PRIMARY KEY(`vehicle_id`, `purpose`, `position`),
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "vehicle_media_purpose_check" CHECK("vehicle_media"."purpose" IN ('card', 'gallery'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vehicle_media_url_idx` ON `vehicle_media` (`vehicle_id`,`purpose`,`url`);--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` integer PRIMARY KEY NOT NULL,
	`make` text NOT NULL,
	`model` text NOT NULL,
	`year` integer NOT NULL,
	`price` integer NOT NULL,
	`mileage_km` integer NOT NULL,
	`fuel` text NOT NULL,
	`body` text NOT NULL,
	`badge` text DEFAULT '' NOT NULL,
	`color` text,
	`transmission` text,
	`drivetrain` text,
	`doors` integer,
	`seats` integer,
	`origin` text DEFAULT 'local' NOT NULL,
	`country` text,
	`city` text,
	`import_region` text,
	`engine_litres` real,
	`seller_type` text,
	`verified` integer DEFAULT false NOT NULL,
	`available` integer DEFAULT true NOT NULL,
	`hidden` integer DEFAULT false NOT NULL,
	`sample` integer DEFAULT false NOT NULL,
	`rentable` integer DEFAULT false NOT NULL,
	`listed_days_ago` integer DEFAULT 0 NOT NULL,
	`daily_rate` integer,
	`sort_position` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "vehicles_origin_check" CHECK("vehicles"."origin" IN ('local', 'abroad')),
	CONSTRAINT "vehicles_import_region_check" CHECK("vehicles"."import_region" IS NULL OR "vehicles"."import_region" IN ('Europe', 'Asia', 'America')),
	CONSTRAINT "vehicles_seller_type_check" CHECK("vehicles"."seller_type" IS NULL OR "vehicles"."seller_type" IN ('Dealer', 'Private')),
	CONSTRAINT "vehicles_location_shape_check" CHECK(("vehicles"."origin" = 'local' AND "vehicles"."country" IS NOT NULL AND "vehicles"."city" IS NOT NULL AND "vehicles"."import_region" IS NULL)
          OR ("vehicles"."origin" = 'abroad' AND "vehicles"."country" IS NULL AND "vehicles"."city" IS NULL AND "vehicles"."import_region" IS NOT NULL AND "vehicles"."rentable" = 0))
);
--> statement-breakpoint
CREATE INDEX `vehicles_visibility_sort_idx` ON `vehicles` (`hidden`,`available`,`sort_position`,`id`);--> statement-breakpoint
CREATE INDEX `vehicles_make_model_idx` ON `vehicles` (`make`,`model`);--> statement-breakpoint
CREATE INDEX `vehicles_location_idx` ON `vehicles` (`origin`,`country`,`city`,`import_region`);--> statement-breakpoint
CREATE INDEX `vehicles_price_year_idx` ON `vehicles` (`price`,`year`);--> statement-breakpoint
CREATE INDEX `orders_status_created_idx` ON `orders` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `part_requests_status_created_idx` ON `part_requests` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `seller_inquiries_car_created_idx` ON `seller_inquiries` (`car_id`,`created_at`);