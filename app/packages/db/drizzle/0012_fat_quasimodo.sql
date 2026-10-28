CREATE TABLE `onboarding_state` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`step` integer DEFAULT 1 NOT NULL,
	`checks` text DEFAULT '{}' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `onboarding_state_user_id_unique` ON `onboarding_state` (`user_id`);