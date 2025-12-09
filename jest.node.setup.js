// Init database in memory for node tests
import { db, initializeFts } from './src/lib/database';
import { emails } from './src/lib/schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';

beforeAll(async () => {
  // Run all migrations to set up schema in in-memory database
  await migrate(db, {
    migrationsFolder: path.join(process.cwd(), 'drizzle'),
  });

  // Initialize FTS5 virtual table after schema is created
  initializeFts();
});

afterAll(async () => {
  await db.delete(emails);
});
