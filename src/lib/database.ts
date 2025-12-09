import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const dbPath = process.env.NODE_ENV === 'test' ? ':memory:' : './sqlite.db';
export const sqlite = new Database(dbPath);

sqlite.pragma('journal_mode = WAL');

export function initializeFts() {
  const ftsExists = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='emails_fts'",
    )
    .get();

  if (!ftsExists) {
    // Use explicit email_id column (UNINDEXED) instead of relying on rowid,
    // which can become unreliable after deletions/updates
    sqlite.exec(`
      CREATE VIRTUAL TABLE emails_fts USING fts5(
        email_id UNINDEXED,
        subject,
        from_addr,
        to_addr,
        content
      );
    `);

    sqlite.exec(`
      INSERT INTO emails_fts(email_id, subject, from_addr, to_addr, content)
      SELECT id, subject, "from", "to", content FROM emails;
    `);

    sqlite.exec(`
      CREATE TRIGGER emails_fts_insert AFTER INSERT ON emails BEGIN
        INSERT INTO emails_fts(email_id, subject, from_addr, to_addr, content)
        VALUES (new.id, new.subject, new."from", new."to", new.content);
      END;
    `);

    sqlite.exec(`
      CREATE TRIGGER emails_fts_delete AFTER DELETE ON emails BEGIN
        DELETE FROM emails_fts WHERE email_id = old.id;
      END;
    `);

    sqlite.exec(`
      CREATE TRIGGER emails_fts_update AFTER UPDATE ON emails BEGIN
        DELETE FROM emails_fts WHERE email_id = old.id;
        INSERT INTO emails_fts(email_id, subject, from_addr, to_addr, content)
        VALUES (new.id, new.subject, new."from", new."to", new.content);
      END;
    `);
  }
}

try {
  const emailsTableExists = sqlite
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='emails'",
    )
    .get();
  if (emailsTableExists) {
    initializeFts();
  }
} catch {}

export const db = drizzle(sqlite, { schema });
