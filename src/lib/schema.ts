import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export enum EmailDirection {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}

export const emails = sqliteTable(
  'emails',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    threadId: text('thread_id').notNull(),
    subject: text('subject').notNull(),
    from: text('from').notNull(),
    to: text('to').notNull(),
    cc: text('cc'),
    bcc: text('bcc'),
    content: text('content'),
    isRead: integer('is_read', { mode: 'boolean' }).default(false).notNull(),
    isImportant: integer('is_important', { mode: 'boolean' })
      .default(false)
      .notNull(),
    isDeleted: integer('is_deleted', { mode: 'boolean' })
      .default(false)
      .notNull(),
    direction: text('direction')
      .notNull()
      .$type<EmailDirection>()
      .default(EmailDirection.INCOMING),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
  },
  (table) => [
    // Single column indexes
    index('thread_id_idx').on(table.threadId),
    index('direction_idx').on(table.direction),
    index('is_important_idx').on(table.isImportant),
    index('is_deleted_idx').on(table.isDeleted),
    index('created_at_idx').on(table.createdAt),
    index('is_read_idx').on(table.isRead),
    // Composite indexes
    index('filter_idx').on(table.isDeleted, table.direction, table.createdAt),
    index('important_filter_idx').on(
      table.isDeleted,
      table.isImportant,
      table.createdAt,
    ),
    index('thread_agg_idx').on(table.threadId, table.createdAt),
  ],
);

export type Email = typeof emails.$inferSelect;
export type EmailData = typeof emails.$inferInsert;
