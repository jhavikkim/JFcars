CREATE TABLE `email_verification_tokens` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `auth_users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `email_verification_tokens_user_idx` ON `email_verification_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `email_verification_tokens_expires_idx` ON `email_verification_tokens` (`expires_at`);--> statement-breakpoint
ALTER TABLE `auth_users` ADD `email_verified_at` text;--> statement-breakpoint
UPDATE `auth_users`
SET `email_verified_at` = COALESCE(`email_verified_at`, `created_at`);
