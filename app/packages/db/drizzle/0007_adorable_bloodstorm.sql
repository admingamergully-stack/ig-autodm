CREATE UNIQUE INDEX `comment_action_uidx` ON `comment_logs` (`comment_id`,`action`);--> statement-breakpoint
CREATE UNIQUE INDEX `gate_wait_uidx` ON `gate_waits` (`account_id`,`igsid`,`media_id`);