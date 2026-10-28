CREATE TABLE `byok_credentials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`ig_app_id_enc` text NOT NULL,
	`ig_app_secret_enc` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `byok_credentials_user_id_unique` ON `byok_credentials` (`user_id`);