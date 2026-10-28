CREATE TABLE `comment_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer,
	`media_id` text,
	`comment_id` text NOT NULL,
	`commenter_id` text,
	`action` text NOT NULL,
	`status` text NOT NULL,
	`error` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `ig_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`ig_user_id` text NOT NULL,
	`page_id` text,
	`username` text,
	`token_enc` text NOT NULL,
	`token_expires` integer,
	`default_comment_reply` text,
	`default_dm_text` text,
	`dm_enabled` integer DEFAULT false NOT NULL,
	`reply_enabled` integer DEFAULT true NOT NULL,
	`keyword` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `ig_accounts_ig_user_id_unique` ON `ig_accounts` (`ig_user_id`);--> statement-breakpoint
CREATE TABLE `media_cache` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`media_id` text NOT NULL,
	`caption` text,
	`thumbnail_url` text,
	`permalink` text
);
--> statement-breakpoint
CREATE TABLE `media_configs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`media_id` text NOT NULL,
	`comment_reply` text,
	`dm_text` text,
	`dm_enabled` integer,
	`reply_enabled` integer,
	`keyword` text
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`supabase_user_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_supabase_user_id_unique` ON `users` (`supabase_user_id`);