CREATE VIRTUAL TABLE IF NOT EXISTS emails_fts USING fts5(email_id UNINDEXED, subject, from_addr, to_addr, content);
--> statement-breakpoint
INSERT INTO emails_fts(email_id, subject, from_addr, to_addr, content) SELECT id, subject, "from", "to", content FROM emails;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS emails_fts_insert AFTER INSERT ON emails BEGIN INSERT INTO emails_fts(email_id, subject, from_addr, to_addr, content) VALUES (new.id, new.subject, new."from", new."to", new.content); END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS emails_fts_delete AFTER DELETE ON emails BEGIN DELETE FROM emails_fts WHERE email_id = old.id; END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS emails_fts_update AFTER UPDATE ON emails BEGIN DELETE FROM emails_fts WHERE email_id = old.id; INSERT INTO emails_fts(email_id, subject, from_addr, to_addr, content) VALUES (new.id, new.subject, new."from", new."to", new.content); END;
