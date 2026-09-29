ALTER TABLE `storefront_settings` ADD `hero_image_url` text;--> statement-breakpoint
ALTER TABLE `storefront_settings` ADD `hero_background` text DEFAULT '#f8f1e3' NOT NULL;--> statement-breakpoint
ALTER TABLE `storefront_settings` ADD `brand_search_background` text DEFAULT '#f9f1df' NOT NULL;--> statement-breakpoint
ALTER TABLE `storefront_settings` ADD `primary_color` text DEFAULT '#183c36' NOT NULL;--> statement-breakpoint
ALTER TABLE `storefront_settings` ADD `accent_color` text DEFAULT '#db5b2a' NOT NULL;--> statement-breakpoint
ALTER TABLE `storefront_settings` ADD `header_background` text DEFAULT '#fffdf8' NOT NULL;--> statement-breakpoint
ALTER TABLE `storefront_settings` ADD `button_color` text DEFAULT '#1f6a4d' NOT NULL;--> statement-breakpoint
ALTER TABLE `storefront_settings` ADD `text_color` text DEFAULT '#193a34' NOT NULL;