import { db, sqlite } from '@/lib/database';
import { emails, Email, EmailDirection } from '@/lib/schema';
import { eq, and, count, inArray, sql, SQL } from 'drizzle-orm';
import {
  GetEmailsQuery,
  CreateEmailInput,
  UpdateEmailInput,
} from '@/lib/validations';
import { Errors } from '@/lib/errors/ServiceError';
import { withErrorHandling } from '@/lib/withErrorHandling';
import { CURRENT_USER_EMAIL } from '@/constants';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// Raw SQL queries return timestamps as Unix seconds (integers).
// JavaScript Date expects milliseconds, hence * 1000.
// NOTE: Drizzle ORM methods (insert/update with .returning()) handle this
// conversion automatically via `mode: 'timestamp'` in schema.ts.
// This multiplier is ONLY needed for raw SQL queries (db.all<RawEmailRow>).
const SQLITE_TIMESTAMP_MULTIPLIER = 1000;

// Cached FTS availability check (evaluated once at startup)
let ftsAvailable: boolean | null = null;

function isFtsAvailable(): boolean {
  if (ftsAvailable === null) {
    ftsAvailable = !!sqlite
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name='emails_fts'",
      )
      .get();
  }
  return ftsAvailable;
}

interface RawEmailRow {
  id: number;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  cc: string | null;
  bcc: string | null;
  content: string | null;
  isRead: number;
  isImportant: number;
  isDeleted: number;
  direction: string;
  createdAt: number;
  updatedAt: number;
}

interface RawThreadedEmailRow extends RawEmailRow {
  thread_important: number | null;
  total: number;
}

/** Maps raw SQL result to Email type. Only use for db.all<RawEmailRow> results. */
function mapRawEmailToEmail(row: RawEmailRow): Email {
  return {
    id: row.id,
    threadId: row.threadId,
    subject: row.subject,
    from: row.from,
    to: row.to,
    cc: row.cc,
    bcc: row.bcc,
    content: row.content,
    isRead: Boolean(row.isRead),
    isImportant: Boolean(row.isImportant),
    isDeleted: Boolean(row.isDeleted),
    direction: row.direction as EmailDirection,
    createdAt: new Date(row.createdAt * SQLITE_TIMESTAMP_MULTIPLIER),
    updatedAt: new Date(row.updatedAt * SQLITE_TIMESTAMP_MULTIPLIER),
  };
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface GetEmailsOptions extends Omit<GetEmailsQuery, 'threadOnly'> {
  threadOnly?: boolean;
  page?: number;
  pageSize?: number;
}

type FilterConditionBuilder = () => SQL | undefined;

const FILTER_CONDITIONS: Record<string, FilterConditionBuilder> = {
  trash: () => eq(emails.isDeleted, true),
  inbox: () =>
    and(
      eq(emails.isDeleted, false),
      eq(emails.direction, EmailDirection.INCOMING),
    ),
  sent: () =>
    and(
      eq(emails.isDeleted, false),
      eq(emails.direction, EmailDirection.OUTGOING),
    ),
  important: () =>
    and(eq(emails.isDeleted, false), eq(emails.isImportant, true)),
  default: () => eq(emails.isDeleted, false),
};

/**
 * Searches for email IDs using FTS5 full-text search.
 *
 * Uses explicit email_id column instead of rowid for reliability.
 * FTS rowid can diverge from the source table's id after deletions/updates.
 *
 * @returns Array of matching email IDs, empty array if no matches,
 *          or null if FTS table doesn't exist (signals fallback to LIKE)
 */
function searchEmailIdsFts(searchTerm: string): number[] | null {
  try {
    if (!isFtsAvailable()) return null;

    // Normalize search term for FTS matching:
    // 1. Convert email delimiters (dots, @, hyphens) to spaces to match FTS tokenization
    // 2. Strip remaining special chars that could break FTS syntax
    // 3. Collapse multiple spaces
    const escapedTerm = searchTerm
      .replace(/[.@\-_]/g, ' ')
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!escapedTerm) return [];

    // Query using explicit email_id column instead of rowid
    // The FTS table stores email_id to maintain a stable reference to the source row
    const results = sqlite
      .prepare('SELECT email_id FROM emails_fts WHERE emails_fts MATCH ?')
      .all(`${escapedTerm}*`) as { email_id: number }[];

    return results.map((r) => r.email_id);
  } catch (error) {
    console.warn('[FTS Search] Failed, falling back to LIKE:', error);
    return null;
  }
}

/**
 * Builds SQL conditions array based on query options.
 *
 * Search strategy (requires 3+ characters):
 * 1. Try FTS5 full-text search (fast, ranked results)
 * 2. If FTS unavailable, fall back to LIKE queries (slower, case-insensitive)
 * 3. If FTS returns empty results, use `1=0` to return no matches
 */
function buildConditions(options: GetEmailsOptions): SQL[] {
  const { search, filter, threadId } = options;
  const conditions: SQL[] = [];

  if (threadId) {
    conditions.push(eq(emails.threadId, threadId));
  }

  if (search && search.length >= 3) {
    const ftsIds = searchEmailIdsFts(search);
    if (ftsIds !== null && ftsIds.length > 0) {
      // FTS found matches - filter to those specific email IDs
      conditions.push(inArray(emails.id, ftsIds));
    } else if (ftsIds === null) {
      // FTS unavailable - fall back to LIKE search across key fields
      const searchPattern = `%${search}%`;
      conditions.push(
        sql`(
          ${emails.subject} LIKE ${searchPattern}
          OR ${emails.from} LIKE ${searchPattern}
          OR ${emails.to} LIKE ${searchPattern}
          OR ${emails.content} LIKE ${searchPattern}
        )`,
      );
    } else {
      // FTS returned empty results - ensure query returns nothing
      conditions.push(sql`1 = 0`);
    }
  }

  const filterBuilder =
    FILTER_CONDITIONS[filter ?? 'default'] ?? FILTER_CONDITIONS.default!;
  const filterCondition = filterBuilder();
  if (filterCondition) {
    conditions.push(filterCondition);
  }

  return conditions;
}

async function getEmailsThreaded(
  conditions: SQL[],
  page: number,
  pageSize: number,
): Promise<PaginatedResult<Email>> {
  const offset = page * pageSize;
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Thread-grouped email query with pagination
  // This query returns the latest email from each thread that matches the filter,
  // while computing thread importance globally (across all emails in the thread,
  // not just filtered ones).
  const result = db.all<RawThreadedEmailRow>(sql`
    WITH
    -- Step 1: Filter emails based on current view (inbox, sent, trash, etc.)
    filtered AS (
      SELECT *
      FROM emails
      WHERE ${whereClause ?? sql`1=1`}
    ),
    -- Step 2: Rank emails within each thread by recency to find the latest
    ranked AS (
      SELECT *,
        ROW_NUMBER() OVER (
          PARTITION BY thread_id
          ORDER BY created_at DESC, id DESC
        ) as rn
      FROM filtered
    ),
    -- Step 3: Keep only the most recent email per thread
    latest_per_thread AS (
      SELECT * FROM ranked WHERE rn = 1
    ),
    -- Step 4: Compute thread importance from the FULL emails table
    -- This ensures importance is consistent regardless of current filter
    -- (e.g., a thread is important if ANY non-deleted email in it is marked important)
    thread_importance AS (
      SELECT
        thread_id,
        MAX(CASE WHEN is_deleted = 0 AND is_important = 1 THEN 1 ELSE 0 END) AS thread_important
      FROM emails
      GROUP BY thread_id
    ),
    -- Step 5: Join importance data and apply pagination
    paginated AS (
      SELECT lpt.*, ti.thread_important,
        (SELECT COUNT(DISTINCT thread_id) FROM latest_per_thread) as total
      FROM latest_per_thread lpt
      LEFT JOIN thread_importance ti ON lpt.thread_id = ti.thread_id
      ORDER BY lpt.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    )
    -- Step 6: Final select with column aliasing for TypeScript compatibility
    SELECT
      id, thread_id as "threadId", subject, "from", "to",
      cc, bcc, content, is_read as "isRead",
      COALESCE(thread_important, 0) as "isImportant",
      is_deleted as "isDeleted", direction,
      created_at as "createdAt", updated_at as "updatedAt",
      total
    FROM paginated
    ORDER BY "createdAt" DESC
  `);

  const total = result[0]?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const data = result.map(mapRawEmailToEmail);

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasMore: page < totalPages - 1,
    },
  };
}

async function getEmailsList(
  conditions: SQL[],
  page: number,
  pageSize: number,
  threadId?: string,
): Promise<PaginatedResult<Email>> {
  const offset = page * pageSize;
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countResult = await db
    .select({ count: count() })
    .from(emails)
    .where(whereClause);
  const total = countResult[0]?.count ?? 0;

  // Use raw SQL to get emails with proper column aliasing
  // This ensures we go through mapRawEmailToEmail for consistent Date conversion
  // When fetching a specific thread, use ASC for chronological conversation flow
  const sortDirection = threadId ? sql`ASC` : sql`DESC`;
  const rows = db.all<RawEmailRow>(sql`
    SELECT
      id, thread_id as "threadId", subject, "from", "to",
      cc, bcc, content, is_read as "isRead", is_important as "isImportant",
      is_deleted as "isDeleted", direction,
      created_at as "createdAt", updated_at as "updatedAt"
    FROM emails
    WHERE ${whereClause ?? sql`1=1`}
    ORDER BY created_at ${sortDirection}
    LIMIT ${pageSize} OFFSET ${offset}
  `);

  const data = rows.map(mapRawEmailToEmail);
  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasMore: page < totalPages - 1,
    },
  };
}

export async function getEmails(
  options: GetEmailsOptions = {
    threadOnly: false,
  },
): Promise<PaginatedResult<Email>> {
  return withErrorHandling(async () => {
    const { threadOnly } = options;
    const page = Math.max(0, options.page ?? 0);
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, options.pageSize ?? DEFAULT_PAGE_SIZE),
    );

    const conditions = buildConditions(options);

    if (threadOnly) {
      return getEmailsThreaded(conditions, page, pageSize);
    }

    return getEmailsList(conditions, page, pageSize, options.threadId);
  }, 'getEmails');
}

export async function getEmailById(id: number): Promise<Email | null> {
  return withErrorHandling(async () => {
    // Use raw SQL to ensure consistent Date conversion through mapRawEmailToEmail
    const rows = db.all<RawEmailRow>(sql`
      SELECT
        id, thread_id as "threadId", subject, "from", "to",
        cc, bcc, content, is_read as "isRead", is_important as "isImportant",
        is_deleted as "isDeleted", direction,
        created_at as "createdAt", updated_at as "updatedAt"
      FROM emails
      WHERE id = ${id}
      LIMIT 1
    `);
    return rows[0] ? mapRawEmailToEmail(rows[0]) : null;
  }, 'getEmailById');
}

export interface ThreadCounts {
  inbox: number;
  sent: number;
  important: number;
  trash: number;
  unread: number;
}

export async function getThreadCounts(): Promise<ThreadCounts> {
  return withErrorHandling(async () => {
    // Count distinct threads for each category
    // All counts are thread-based for consistency in the sidebar
    const [result] = db.all<ThreadCounts>(sql`
      SELECT
        COUNT(DISTINCT CASE WHEN is_deleted = 0 AND direction = 'incoming' THEN thread_id END) as inbox,
        COUNT(DISTINCT CASE WHEN is_deleted = 0 AND direction = 'outgoing' THEN thread_id END) as sent,
        COUNT(DISTINCT CASE WHEN is_deleted = 0 AND is_important = 1 THEN thread_id END) as important,
        COUNT(DISTINCT CASE WHEN is_deleted = 1 THEN thread_id END) as trash,
        -- Unread is also thread-based: count threads that have at least one unread email
        COUNT(DISTINCT CASE WHEN is_deleted = 0 AND is_read = 0 THEN thread_id END) as unread
      FROM emails
    `);

    return {
      inbox: result?.inbox ?? 0,
      sent: result?.sent ?? 0,
      important: result?.important ?? 0,
      trash: result?.trash ?? 0,
      unread: result?.unread ?? 0,
    };
  }, 'getThreadCounts');
}

export async function createEmail(data: CreateEmailInput): Promise<Email> {
  return withErrorHandling(async () => {
    const { to, cc, bcc, subject, content, threadId } = data;

    const result = await db
      .insert(emails)
      .values({
        to,
        cc: cc || null,
        bcc: bcc || null,
        subject,
        content: content || null,
        from: CURRENT_USER_EMAIL,
        threadId: threadId || crypto.randomUUID(),
        direction: EmailDirection.OUTGOING,
        isRead: true,
      })
      .returning();

    if (!result[0]) {
      throw Errors.database('Failed to create email');
    }

    return result[0];
  }, 'createEmail');
}

export async function updateEmail(
  id: number,
  data: UpdateEmailInput,
): Promise<Email | null> {
  return withErrorHandling(async () => {
    const updates: Partial<{
      isRead: boolean;
      isImportant: boolean;
    }> = {};

    if (typeof data.isRead === 'boolean') {
      updates.isRead = data.isRead;
    }
    if (typeof data.isImportant === 'boolean') {
      updates.isImportant = data.isImportant;
    }

    const result = await db
      .update(emails)
      .set({ ...updates, updatedAt: sql`(strftime('%s', 'now'))` })
      .where(eq(emails.id, id))
      .returning();

    return result[0] ?? null;
  }, 'updateEmail');
}

export async function deleteEmail(id: number): Promise<boolean> {
  return withErrorHandling(async () => {
    const result = await db
      .update(emails)
      .set({ isDeleted: true, updatedAt: sql`(strftime('%s', 'now'))` })
      .where(eq(emails.id, id))
      .returning({ id: emails.id });

    return result.length > 0;
  }, 'deleteEmail');
}

export async function deleteThread(threadId: string): Promise<boolean> {
  return withErrorHandling(async () => {
    const result = await db
      .update(emails)
      .set({ isDeleted: true, updatedAt: sql`(strftime('%s', 'now'))` })
      .where(eq(emails.threadId, threadId))
      .returning({ id: emails.id });

    return result.length > 0;
  }, 'deleteThread');
}

export async function restoreThread(threadId: string): Promise<boolean> {
  return withErrorHandling(async () => {
    const result = await db
      .update(emails)
      .set({ isDeleted: false, updatedAt: sql`(strftime('%s', 'now'))` })
      .where(eq(emails.threadId, threadId))
      .returning({ id: emails.id });

    return result.length > 0;
  }, 'restoreThread');
}

export async function permanentlyDeleteThread(
  threadId: string,
): Promise<boolean> {
  return withErrorHandling(async () => {
    const result = await db
      .delete(emails)
      .where(eq(emails.threadId, threadId))
      .returning({ id: emails.id });

    return result.length > 0;
  }, 'permanentlyDeleteThread');
}
