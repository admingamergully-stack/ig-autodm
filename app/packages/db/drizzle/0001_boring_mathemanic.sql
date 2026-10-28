CREATE TABLE `access_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ig_username` text NOT NULL,
	`email` text NOT NULL,
	`verify_token` text NOT NULL,
	`email_verified_at` integer,
	`consent_at` integer,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `access_requests_verify_token_unique` ON `access_requests` (`verify_token`);