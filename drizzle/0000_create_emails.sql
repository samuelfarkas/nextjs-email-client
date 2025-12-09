CREATE TABLE `emails` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`thread_id` text NOT NULL,
	`subject` text NOT NULL,
	`from` text NOT NULL,
	`to` text NOT NULL,
	`cc` text,
	`bcc` text,
	`content` text,
	`is_read` integer DEFAULT false NOT NULL,
	`is_important` integer DEFAULT false NOT NULL,
	`is_deleted` integer DEFAULT false NOT NULL,
	`direction` text DEFAULT 'incoming' NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updated_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `thread_id_idx` ON `emails` (`thread_id`);--> statement-breakpoint
CREATE INDEX `direction_idx` ON `emails` (`direction`);--> statement-breakpoint
CREATE INDEX `is_important_idx` ON `emails` (`is_important`);--> statement-breakpoint
CREATE INDEX `is_deleted_idx` ON `emails` (`is_deleted`);--> statement-breakpoint
CREATE INDEX `created_at_idx` ON `emails` (`created_at`);--> statement-breakpoint
CREATE INDEX `is_read_idx` ON `emails` (`is_read`);--> statement-breakpoint
CREATE INDEX `filter_idx` ON `emails` (`is_deleted`,`direction`,`created_at`);--> statement-breakpoint
CREATE INDEX `important_filter_idx` ON `emails` (`is_deleted`,`is_important`,`created_at`);--> statement-breakpoint
CREATE INDEX `thread_agg_idx` ON `emails` (`thread_id`,`created_at`);