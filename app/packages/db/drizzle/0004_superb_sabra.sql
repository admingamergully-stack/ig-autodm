DROP INDEX "access_requests_verify_token_unique";--> statement-breakpoint
DROP INDEX "byok_credentials_user_id_unique";--> statement-breakpoint
DROP INDEX "ig_accounts_ig_user_id_unique";--> statement-breakpoint
DROP INDEX "users_supabase_user_id_unique";--> statement-breakpoint
ALTER TABLE `ig_accounts` ALTER COLUMN "via_byok" TO "via_byok" integer;--> statement-breakpoint
CREATE UNIQUE INDEX `access_requests_verify_token_unique` ON `access_requests` (`verify_token`);--> statement-breakpoint
CREATE UNIQUE INDEX `byok_credentials_user_id_unique` ON `byok_credentials` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `ig_accounts_ig_user_id_unique` ON `ig_accounts` (`ig_user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_supabase_user_id_unique` ON `users` (`supabase_user_id`);