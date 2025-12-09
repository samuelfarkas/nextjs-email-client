CREATE TRIGGER IF NOT EXISTS emails_update_timestamp
AFTER UPDATE ON emails
FOR EACH ROW
BEGIN
  UPDATE emails SET updated_at = strftime('%s','now') WHERE id = NEW.id;
END;
