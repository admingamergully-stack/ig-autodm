CREATE TABLE `known_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`username_lower` text NOT NULL,
	`igsid` text NOT NULL,
	`follows` integer,
	`checked_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `known_user_uidx` ON `known_users` (`account_id`,`username_lower`);