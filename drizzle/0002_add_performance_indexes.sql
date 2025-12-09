DROP INDEX IF EXISTS idx_emails_thread_created;
--> statement-breakpoint
CREATE INDEX idx_emails_thread_created ON emails(thread_id, created_at DESC, id DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_emails_inbox ON emails(is_deleted, direction, created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_emails_important ON emails(is_deleted, is_important, created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_emails_trash ON emails(is_deleted, created_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_emails_counts ON emails(is_deleted, direction, is_important, is_read, thread_id);
