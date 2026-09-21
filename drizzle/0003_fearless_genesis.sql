PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_gallery_item_translations` (
	`gallery_item_id` text NOT NULL,
	`locale` text NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`comment` text DEFAULT '' NOT NULL,
	PRIMARY KEY(`gallery_item_id`, `locale`),
	FOREIGN KEY (`gallery_item_id`) REFERENCES `gallery_items`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "gallery_translation_locale_check" CHECK("__new_gallery_item_translations"."locale" IN ('en', 'fr', 'es', 'pt'))
);
--> statement-breakpoint
INSERT INTO `__new_gallery_item_translations`("gallery_item_id", "locale", "caption", "comment") SELECT "gallery_item_id", "locale", "caption", "comment" FROM `gallery_item_translations`;--> statement-breakpoint
DROP TABLE `gallery_item_translations`;--> statement-breakpoint
ALTER TABLE `__new_gallery_item_translations` RENAME TO `gallery_item_translations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_storefront_translations` (
	`locale` text PRIMARY KEY NOT NULL,
	`headline` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`gallery_title` text DEFAULT '' NOT NULL,
	`gallery_description` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "storefront_locale_check" CHECK("__new_storefront_translations"."locale" IN ('en', 'fr', 'es', 'pt'))
);
--> statement-breakpoint
INSERT INTO `__new_storefront_translations`("locale", "headline", "description", "gallery_title", "gallery_description", "updated_at") SELECT "locale", "headline", "description", "gallery_title", "gallery_description", "updated_at" FROM `storefront_translations`;--> statement-breakpoint
DROP TABLE `storefront_translations`;--> statement-breakpoint
ALTER TABLE `__new_storefront_translations` RENAME TO `storefront_translations`;--> statement-breakpoint
CREATE TABLE `__saved_user_vehicle_lists` (
	`user_id` text NOT NULL,
	`vehicle_id` integer NOT NULL,
	`list_kind` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`added_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`user_id`, `list_kind`, `vehicle_id`)
);--> statement-breakpoint
INSERT INTO `__saved_user_vehicle_lists`("user_id", "vehicle_id", "list_kind", "position", "added_at") SELECT "user_id", "vehicle_id", "list_kind", "position", "added_at" FROM `user_vehicle_lists`;--> statement-breakpoint
DROP TABLE `user_vehicle_lists`;--> statement-breakpoint
CREATE TABLE `__new_user_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text DEFAULT '' NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`country` text DEFAULT '' NOT NULL,
	`city` text DEFAULT '' NOT NULL,
	`preferred_contact` text DEFAULT '' NOT NULL,
	`preferred_language` text DEFAULT '' NOT NULL,
	`preferred_currency` text DEFAULT 'XAF' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	CONSTRAINT "user_profiles_language_check" CHECK("__new_user_profiles"."preferred_language" = '' OR "__new_user_profiles"."preferred_language" IN ('en', 'fr', 'es', 'pt')),
	CONSTRAINT "user_profiles_currency_check" CHECK("__new_user_profiles"."preferred_currency" IN ('XAF', 'USD', 'EUR', 'AOA'))
);
--> statement-breakpoint
INSERT INTO `__new_user_profiles`("user_id", "name", "phone", "country", "city", "preferred_contact", "preferred_language", "preferred_currency", "updated_at") SELECT "user_id", "name", "phone", "country", "city", "preferred_contact", CASE WHEN "preferred_language" IN ('', 'en', 'fr', 'es', 'pt') THEN "preferred_language" ELSE '' END, 'XAF', "updated_at" FROM `user_profiles`;--> statement-breakpoint
DROP TABLE `user_profiles`;--> statement-breakpoint
ALTER TABLE `__new_user_profiles` RENAME TO `user_profiles`;--> statement-breakpoint
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
);--> statement-breakpoint
INSERT INTO `user_vehicle_lists`("user_id", "vehicle_id", "list_kind", "position", "added_at") SELECT "user_id", "vehicle_id", "list_kind", "position", "added_at" FROM `__saved_user_vehicle_lists`;--> statement-breakpoint
DROP TABLE `__saved_user_vehicle_lists`;--> statement-breakpoint
CREATE INDEX `user_vehicle_lists_vehicle_idx` ON `user_vehicle_lists` (`vehicle_id`);
