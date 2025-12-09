import { db } from '@/lib/database';
import { emails, Email, EmailDirection } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import {
  getEmails,
  getEmailById,
  getThreadCounts,
  createEmail,
  updateEmail,
  deleteEmail,
  deleteThread,
  restoreThread,
  permanentlyDeleteThread,
} from './emailService';
import { CURRENT_USER_EMAIL } from '@/constants';

interface TestEmailData {
  threadId?: string;
  subject?: string;
  from?: string;
  to?: string;
  cc?: string | null;
  bcc?: string | null;
  content?: string | null;
  isRead?: boolean;
  isImportant?: boolean;
  isDeleted?: boolean;
  direction?: EmailDirection;
}

async function createTestEmail(overrides: TestEmailData = {}): Promise<Email> {
  const defaults = {
    threadId: `test-thread-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    subject: 'Test Subject',
    from: 'sender@test.com',
    to: 'recipient@test.com',
    cc: null,
    bcc: null,
    content: 'Test content',
    isRead: false,
    isImportant: false,
    isDeleted: false,
    direction: EmailDirection.INCOMING,
  };

  const emailData = { ...defaults, ...overrides };

  const [created] = await db.insert(emails).values(emailData).returning();
  return created;
}

async function createTestThread(
  threadId: string,
  count: number,
  baseOverrides: TestEmailData = {},
): Promise<Email[]> {
  const createdEmails: Email[] = [];

  for (let i = 0; i < count; i++) {
    const email = await createTestEmail({
      ...baseOverrides,
      threadId,
      subject: i === 0 ? 'Thread Subject' : `Re: Thread Subject`,
    });
    createdEmails.push(email);
  }

  return createdEmails;
}

async function cleanupTestEmails(threadIdPattern: string): Promise<void> {
  await db
    .delete(emails)
    .where(sql`${emails.threadId} LIKE ${threadIdPattern + '%'}`);
}

describe('EmailService', () => {
  const TEST_PREFIX = `test-${Date.now()}`;

  afterEach(async () => {
    await cleanupTestEmails(TEST_PREFIX);
  });

  describe('getEmails', () => {
    describe('pagination', () => {
      it('should return default page size of 20 when no pageSize specified', async () => {
        const result = await getEmails({});

        expect(result.pagination.pageSize).toBe(20);
        expect(result.data.length).toBeLessThanOrEqual(20);
      });

      it('should respect custom pageSize parameter', async () => {
        const customPageSize = 5;

        const result = await getEmails({ pageSize: customPageSize });

        expect(result.pagination.pageSize).toBe(5);
        expect(result.data.length).toBeLessThanOrEqual(5);
      });

      it('should cap pageSize at maximum of 100', async () => {
        const oversizedPageSize = 500;

        const result = await getEmails({ pageSize: oversizedPageSize });

        expect(result.pagination.pageSize).toBe(100);
      });

      it('should enforce minimum pageSize of 1', async () => {
        const undersizedPageSize = 0;

        const result = await getEmails({ pageSize: undersizedPageSize });

        expect(result.pagination.pageSize).toBe(1);
      });

      it('should return page 0 by default', async () => {
        const result = await getEmails({});

        expect(result.pagination.page).toBe(0);
      });

      it('should respect page parameter for pagination', async () => {
        const pageSize = 5;

        const page0 = await getEmails({ page: 0, pageSize });
        const page1 = await getEmails({ page: 1, pageSize });

        expect(page0.pagination.page).toBe(0);
        expect(page1.pagination.page).toBe(1);

        // Verify different results (assuming sufficient data)
        if (page0.data.length > 0 && page1.data.length > 0) {
          expect(page0.data[0].id).not.toBe(page1.data[0].id);
        }
      });

      it('should enforce minimum page of 0 for negative values', async () => {
        const negativePage = -5;

        const result = await getEmails({ page: negativePage });

        expect(result.pagination.page).toBe(0);
      });

      it('should calculate totalPages correctly', async () => {
        const pageSize = 10;

        const result = await getEmails({ pageSize });

        const expectedTotalPages = Math.ceil(
          result.pagination.total / pageSize,
        );
        expect(result.pagination.totalPages).toBe(expectedTotalPages);
      });

      it('should set hasMore to true when more pages exist', async () => {
        const pageSize = 1;

        const result = await getEmails({ page: 0, pageSize });

        if (result.pagination.total > 1) {
          expect(result.pagination.hasMore).toBe(true);
        }
      });

      it('should set hasMore to false on last page', async () => {
        const pageSize = 5;
        const firstPage = await getEmails({ pageSize });
        const lastPageIndex = Math.max(0, firstPage.pagination.totalPages - 1);

        const lastPage = await getEmails({ page: lastPageIndex, pageSize });

        expect(lastPage.pagination.hasMore).toBe(false);
      });

      it('should return empty data array when page exceeds total pages', async () => {
        const veryHighPage = 99999;

        const result = await getEmails({ page: veryHighPage });

        expect(result.data).toHaveLength(0);
      });
    });

    describe('filtering', () => {
      it('should filter inbox emails (incoming, not deleted)', async () => {
        const threadId = `${TEST_PREFIX}-inbox`;
        await createTestEmail({
          threadId,
          direction: EmailDirection.INCOMING,
          isDeleted: false,
        });
        await createTestEmail({
          threadId: `${TEST_PREFIX}-outgoing`,
          direction: EmailDirection.OUTGOING,
          isDeleted: false,
        });

        const result = await getEmails({ filter: 'inbox' });

        result.data.forEach((email) => {
          expect(email.direction).toBe(EmailDirection.INCOMING);
          expect(email.isDeleted).toBe(false);
        });
      });

      it('should filter sent emails (outgoing, not deleted)', async () => {
        const threadId = `${TEST_PREFIX}-sent`;
        await createTestEmail({
          threadId,
          direction: EmailDirection.OUTGOING,
          isDeleted: false,
        });

        const result = await getEmails({ filter: 'sent' });

        result.data.forEach((email) => {
          expect(email.direction).toBe(EmailDirection.OUTGOING);
          expect(email.isDeleted).toBe(false);
        });
      });

      it('should filter important emails (important, not deleted)', async () => {
        const threadId = `${TEST_PREFIX}-important`;
        await createTestEmail({
          threadId,
          isImportant: true,
          isDeleted: false,
        });

        const result = await getEmails({ filter: 'important' });

        result.data.forEach((email) => {
          expect(email.isImportant).toBe(true);
          expect(email.isDeleted).toBe(false);
        });
      });

      it('should filter trash emails (deleted)', async () => {
        const threadId = `${TEST_PREFIX}-trash`;
        await createTestEmail({
          threadId,
          isDeleted: true,
        });

        const result = await getEmails({ filter: 'trash' });

        result.data.forEach((email) => {
          expect(email.isDeleted).toBe(true);
        });
      });

      it('should exclude deleted emails by default (no filter)', async () => {
        await createTestEmail({
          threadId: `${TEST_PREFIX}-default`,
          isDeleted: false,
        });
        await createTestEmail({
          threadId: `${TEST_PREFIX}-deleted`,
          isDeleted: true,
        });

        const result = await getEmails({});

        result.data.forEach((email) => {
          expect(email.isDeleted).toBe(false);
        });
      });

      it('should filter by threadId when specified', async () => {
        const targetThreadId = `${TEST_PREFIX}-specific-thread`;
        await createTestEmail({ threadId: targetThreadId });
        await createTestEmail({ threadId: `${TEST_PREFIX}-other-thread` });

        const result = await getEmails({ threadId: targetThreadId });

        expect(result.data.length).toBeGreaterThan(0);
        result.data.forEach((email) => {
          expect(email.threadId).toBe(targetThreadId);
        });
      });

      it('should order thread emails by createdAt ascending (oldest first)', async () => {
        const threadId = `${TEST_PREFIX}-thread-order`;
        await createTestThread(threadId, 3);

        const result = await getEmails({ threadId });

        expect(result.data.length).toBe(3);
        // Verify ascending order (oldest first for natural conversation flow)
        for (let i = 1; i < result.data.length; i++) {
          const currentDate = new Date(result.data[i].createdAt);
          const previousDate = new Date(result.data[i - 1].createdAt);
          expect(currentDate.getTime()).toBeGreaterThanOrEqual(
            previousDate.getTime(),
          );
        }
      });
    });

    describe('search', () => {
      it('should ignore search terms shorter than 3 characters', async () => {
        const shortTerm = 'ab';

        const withShortSearch = await getEmails({ search: shortTerm });
        const withoutSearch = await getEmails({});

        expect(withShortSearch.pagination.total).toBe(
          withoutSearch.pagination.total,
        );
      });

      it('should search in subject field', async () => {
        const uniqueSubject = `${TEST_PREFIX}-UniqueSearchableSubject`;
        await createTestEmail({
          threadId: `${TEST_PREFIX}-search-subject`,
          subject: uniqueSubject,
        });

        const result = await getEmails({ search: 'UniqueSearchableSubject' });

        expect(result.data.length).toBeGreaterThan(0);
        expect(
          result.data.some((e) =>
            e.subject.includes('UniqueSearchableSubject'),
          ),
        ).toBe(true);
      });

      it('should search in from field', async () => {
        // Use a unique term without hyphens for FTS compatibility
        const uniqueFromDomain = 'xyzuniquesenderdomain.test';
        const uniqueFrom = `sender@${uniqueFromDomain}`;
        await createTestEmail({
          threadId: `${TEST_PREFIX}-search-from`,
          from: uniqueFrom,
        });

        const result = await getEmails({ search: 'xyzuniquesenderdomain' });

        expect(result.data.length).toBeGreaterThan(0);
        expect(
          result.data.some((e) => e.from.includes('xyzuniquesenderdomain')),
        ).toBe(true);
      });

      it('should search in to field', async () => {
        // Use a unique term without hyphens for FTS compatibility
        const uniqueToDomain = 'xyzuniquerecipientdomain.test';
        const uniqueTo = `recipient@${uniqueToDomain}`;
        await createTestEmail({
          threadId: `${TEST_PREFIX}-search-to`,
          to: uniqueTo,
        });

        const result = await getEmails({ search: 'xyzuniquerecipientdomain' });

        expect(result.data.length).toBeGreaterThan(0);
        expect(
          result.data.some((e) => e.to.includes('xyzuniquerecipientdomain')),
        ).toBe(true);
      });

      it('should search in content field', async () => {
        const uniqueContent = 'UniqueSearchableContentXYZ123';
        await createTestEmail({
          threadId: `${TEST_PREFIX}-search-content`,
          content: uniqueContent,
        });

        const result = await getEmails({
          search: 'UniqueSearchableContentXYZ123',
        });

        expect(result.data.length).toBeGreaterThan(0);
        expect(
          result.data.some((e) =>
            e.content?.includes('UniqueSearchableContentXYZ123'),
          ),
        ).toBe(true);
      });

      it('should return empty results for non-matching search', async () => {
        const nonExistentTerm = 'zzzNonExistentTermXXX999';

        const result = await getEmails({ search: nonExistentTerm });

        expect(result.data).toHaveLength(0);
        expect(result.pagination.total).toBe(0);
      });

      it('should search for email addresses with dots', async () => {
        const uniqueFrom = 'isabella.youngtest@uniquedomain.test';
        await createTestEmail({
          threadId: `${TEST_PREFIX}-search-dots`,
          from: uniqueFrom,
        });

        // Search with dot - should match because dots are converted to spaces
        const result = await getEmails({ search: 'isabella.youngtest' });

        expect(result.data.length).toBeGreaterThan(0);
        expect(
          result.data.some((e) => e.from.includes('isabella.youngtest')),
        ).toBe(true);
      });

      it('should combine search with filter', async () => {
        const searchTerm = 'CombinedSearchTest';
        await createTestEmail({
          threadId: `${TEST_PREFIX}-combined-inbox`,
          subject: `${searchTerm} Inbox Email`,
          direction: EmailDirection.INCOMING,
          isDeleted: false,
        });
        await createTestEmail({
          threadId: `${TEST_PREFIX}-combined-sent`,
          subject: `${searchTerm} Sent Email`,
          direction: EmailDirection.OUTGOING,
          isDeleted: false,
        });

        const inboxResults = await getEmails({
          search: searchTerm,
          filter: 'inbox',
        });
        const sentResults = await getEmails({
          search: searchTerm,
          filter: 'sent',
        });

        inboxResults.data.forEach((email) => {
          expect(email.direction).toBe(EmailDirection.INCOMING);
        });
        sentResults.data.forEach((email) => {
          expect(email.direction).toBe(EmailDirection.OUTGOING);
        });
      });
    });

    describe('thread grouping (threadOnly)', () => {
      it('should return only latest email per thread when threadOnly is true', async () => {
        const threadId = `${TEST_PREFIX}-thread-grouping`;
        const threadEmails = await createTestThread(threadId, 3);
        const latestEmail = threadEmails[threadEmails.length - 1];

        const result = await getEmails({ threadOnly: true, threadId });

        // Should return only 1 email for this thread
        const threadResults = result.data.filter(
          (e) => e.threadId === threadId,
        );
        expect(threadResults).toHaveLength(1);
        expect(threadResults[0].id).toBe(latestEmail.id);
      });

      it('should aggregate thread importance across all thread emails', async () => {
        const threadId = `${TEST_PREFIX}-thread-importance`;
        // First email not important, second is important
        await createTestEmail({
          threadId,
          isImportant: false,
          subject: 'Thread Email 1',
        });
        await createTestEmail({
          threadId,
          isImportant: true,
          subject: 'Re: Thread Email 1',
        });

        const result = await getEmails({ threadOnly: true, threadId });

        const threadResult = result.data.find((e) => e.threadId === threadId);
        expect(threadResult).toBeDefined();
        // Thread should be marked important if ANY email in thread is important
        expect(threadResult!.isImportant).toBe(true);
      });

      it('should return all emails when threadOnly is false', async () => {
        const threadId = `${TEST_PREFIX}-no-grouping`;
        await createTestThread(threadId, 3);

        const result = await getEmails({ threadOnly: false, threadId });

        const threadResults = result.data.filter(
          (e) => e.threadId === threadId,
        );
        expect(threadResults.length).toBe(3);
      });

      it('should order results by createdAt descending', async () => {
        const result = await getEmails({ threadOnly: true });

        for (let i = 1; i < result.data.length; i++) {
          const currentDate = new Date(result.data[i].createdAt);
          const previousDate = new Date(result.data[i - 1].createdAt);
          expect(currentDate.getTime()).toBeLessThanOrEqual(
            previousDate.getTime(),
          );
        }
      });

      it('should count distinct threads for pagination when threadOnly is true', async () => {
        const threadId = `${TEST_PREFIX}-thread-count`;
        await createTestThread(threadId, 5); // 5 emails in 1 thread

        const withThreading = await getEmails({ threadOnly: true, threadId });
        const withoutThreading = await getEmails({
          threadOnly: false,
          threadId,
        });

        // Threading should show 1 thread, non-threading should show 5 emails
        expect(withThreading.pagination.total).toBe(1);
        expect(withoutThreading.pagination.total).toBe(5);
      });
    });
  });

  describe('getEmailById', () => {
    it('should return email when it exists', async () => {
      const created = await createTestEmail({
        threadId: `${TEST_PREFIX}-get-by-id`,
        subject: 'Specific Email',
      });

      const result = await getEmailById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(created.id);
      expect(result!.subject).toBe('Specific Email');
    });

    it('should return null when email does not exist', async () => {
      const nonExistentId = 999999999;

      const result = await getEmailById(nonExistentId);

      expect(result).toBeNull();
    });

    it('should return email with all fields correctly mapped', async () => {
      const created = await createTestEmail({
        threadId: `${TEST_PREFIX}-full-fields`,
        subject: 'Full Fields Test',
        from: 'from@test.com',
        to: 'to@test.com',
        cc: 'cc@test.com',
        bcc: 'bcc@test.com',
        content: 'Full content here',
        isRead: true,
        isImportant: true,
        isDeleted: false,
        direction: EmailDirection.OUTGOING,
      });

      const result = await getEmailById(created.id);

      expect(result).not.toBeNull();
      expect(result!.threadId).toBe(created.threadId);
      expect(result!.subject).toBe('Full Fields Test');
      expect(result!.from).toBe('from@test.com');
      expect(result!.to).toBe('to@test.com');
      expect(result!.cc).toBe('cc@test.com');
      expect(result!.bcc).toBe('bcc@test.com');
      expect(result!.content).toBe('Full content here');
      expect(result!.isRead).toBe(true);
      expect(result!.isImportant).toBe(true);
      expect(result!.isDeleted).toBe(false);
      expect(result!.direction).toBe(EmailDirection.OUTGOING);
      expect(result!.createdAt).toBeInstanceOf(Date);
      expect(result!.updatedAt).toBeInstanceOf(Date);
    });

    it('should return deleted emails (no filter applied)', async () => {
      const created = await createTestEmail({
        threadId: `${TEST_PREFIX}-deleted-fetch`,
        isDeleted: true,
      });

      const result = await getEmailById(created.id);

      expect(result).not.toBeNull();
      expect(result!.isDeleted).toBe(true);
    });
  });
  describe('getThreadCounts', () => {
    it('should return counts for all categories', async () => {
      const counts = await getThreadCounts();

      expect(counts).toHaveProperty('inbox');
      expect(counts).toHaveProperty('sent');
      expect(counts).toHaveProperty('important');
      expect(counts).toHaveProperty('trash');
      expect(counts).toHaveProperty('unread');

      expect(typeof counts.inbox).toBe('number');
      expect(typeof counts.sent).toBe('number');
      expect(typeof counts.important).toBe('number');
      expect(typeof counts.trash).toBe('number');
      expect(typeof counts.unread).toBe('number');
    });

    it('should count distinct threads for inbox', async () => {
      const threadId = `${TEST_PREFIX}-count-inbox`;
      // Create 3 emails in same thread
      await createTestThread(threadId, 3, {
        direction: EmailDirection.INCOMING,
        isDeleted: false,
      });

      const beforeCounts = await getThreadCounts();

      await createTestEmail({
        threadId,
        direction: EmailDirection.INCOMING,
        isDeleted: false,
      });

      const afterCounts = await getThreadCounts();

      expect(afterCounts.inbox).toBe(beforeCounts.inbox);
    });

    it('should increment inbox count for new thread', async () => {
      const beforeCounts = await getThreadCounts();

      await createTestEmail({
        threadId: `${TEST_PREFIX}-new-inbox-thread`,
        direction: EmailDirection.INCOMING,
        isDeleted: false,
      });

      const afterCounts = await getThreadCounts();

      expect(afterCounts.inbox).toBe(beforeCounts.inbox + 1);
    });

    it('should count sent emails correctly', async () => {
      const beforeCounts = await getThreadCounts();

      await createTestEmail({
        threadId: `${TEST_PREFIX}-sent-thread`,
        direction: EmailDirection.OUTGOING,
        isDeleted: false,
      });

      const afterCounts = await getThreadCounts();

      expect(afterCounts.sent).toBe(beforeCounts.sent + 1);
    });

    it('should count important emails correctly', async () => {
      const beforeCounts = await getThreadCounts();

      await createTestEmail({
        threadId: `${TEST_PREFIX}-important-thread`,
        isImportant: true,
        isDeleted: false,
      });

      const afterCounts = await getThreadCounts();

      expect(afterCounts.important).toBe(beforeCounts.important + 1);
    });

    it('should count trash (deleted) emails correctly', async () => {
      const beforeCounts = await getThreadCounts();

      await createTestEmail({
        threadId: `${TEST_PREFIX}-trash-thread`,
        isDeleted: true,
      });

      const afterCounts = await getThreadCounts();

      expect(afterCounts.trash).toBe(beforeCounts.trash + 1);
    });

    it('should count unread emails correctly', async () => {
      const beforeCounts = await getThreadCounts();

      await createTestEmail({
        threadId: `${TEST_PREFIX}-unread-thread`,
        isRead: false,
        isDeleted: false,
      });

      const afterCounts = await getThreadCounts();

      expect(afterCounts.unread).toBe(beforeCounts.unread + 1);
    });

    it('should not count deleted emails in inbox/sent/important', async () => {
      const beforeCounts = await getThreadCounts();

      await createTestEmail({
        threadId: `${TEST_PREFIX}-deleted-incoming`,
        direction: EmailDirection.INCOMING,
        isImportant: true,
        isDeleted: true,
      });

      const afterCounts = await getThreadCounts();

      expect(afterCounts.inbox).toBe(beforeCounts.inbox); // Should not increase
      expect(afterCounts.important).toBe(beforeCounts.important); // Should not increase
      expect(afterCounts.trash).toBe(beforeCounts.trash + 1); // Should increase
    });
  });
  describe('createEmail', () => {
    const createdEmailIds: number[] = [];

    afterEach(async () => {
      // Clean up created emails
      for (const id of createdEmailIds) {
        await db.delete(emails).where(eq(emails.id, id));
      }
      createdEmailIds.length = 0;
    });

    it('should create email with required fields', async () => {
      const emailData = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
      };

      const created = await createEmail(emailData);
      createdEmailIds.push(created.id);

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.to).toBe('recipient@test.com');
      expect(created.subject).toBe('Test Subject');
    });

    it('should set from field to CURRENT_USER_EMAIL', async () => {
      const emailData = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
      };

      const created = await createEmail(emailData);
      createdEmailIds.push(created.id);

      expect(created.from).toBe(CURRENT_USER_EMAIL);
    });

    it('should set direction to OUTGOING', async () => {
      const emailData = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
      };

      const created = await createEmail(emailData);
      createdEmailIds.push(created.id);

      expect(created.direction).toBe(EmailDirection.OUTGOING);
    });

    it('should set isRead to true (outgoing emails are read)', async () => {
      const emailData = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
      };

      const created = await createEmail(emailData);
      createdEmailIds.push(created.id);

      expect(created.isRead).toBe(true);
    });

    it('should generate threadId when not provided', async () => {
      const emailData = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
      };

      const created = await createEmail(emailData);
      createdEmailIds.push(created.id);

      expect(created.threadId).toBeDefined();
      expect(created.threadId.length).toBeGreaterThan(0);
      // UUID format check
      expect(created.threadId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should use provided threadId for replies', async () => {
      const existingThreadId = `${TEST_PREFIX}-reply-thread`;
      const emailData = {
        to: 'recipient@test.com',
        subject: 'Re: Original Subject',
        threadId: existingThreadId,
      };

      const created = await createEmail(emailData);
      createdEmailIds.push(created.id);

      expect(created.threadId).toBe(existingThreadId);
    });

    it('should store cc field when provided', async () => {
      const emailData = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
        cc: 'cc@test.com',
      };

      const created = await createEmail(emailData);
      createdEmailIds.push(created.id);

      expect(created.cc).toBe('cc@test.com');
    });

    it('should store bcc field when provided', async () => {
      const emailData = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
        bcc: 'bcc@test.com',
      };

      const created = await createEmail(emailData);
      createdEmailIds.push(created.id);

      expect(created.bcc).toBe('bcc@test.com');
    });

    it('should store content when provided', async () => {
      const emailData = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
        content: 'This is the email body content.',
      };

      const created = await createEmail(emailData);
      createdEmailIds.push(created.id);

      expect(created.content).toBe('This is the email body content.');
    });

    it('should set null for optional fields when not provided', async () => {
      const emailData = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
      };

      const created = await createEmail(emailData);
      createdEmailIds.push(created.id);

      expect(created.cc).toBeNull();
      expect(created.bcc).toBeNull();
      expect(created.content).toBeNull();
    });

    it('should set timestamps on creation', async () => {
      const beforeCreate = new Date();
      const emailData = {
        to: 'recipient@test.com',
        subject: 'Test Subject',
      };

      const created = await createEmail(emailData);
      createdEmailIds.push(created.id);
      const afterCreate = new Date();

      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);
      expect(created.createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime() - 1000,
      );
      expect(created.createdAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime() + 1000,
      );
    });

    it('should persist email to database', async () => {
      const emailData = {
        to: 'recipient@test.com',
        subject: 'Persistence Test',
      };

      const created = await createEmail(emailData);
      createdEmailIds.push(created.id);

      const [dbEmail] = await db
        .select()
        .from(emails)
        .where(eq(emails.id, created.id));
      expect(dbEmail).toBeDefined();
      expect(dbEmail.subject).toBe('Persistence Test');
    });
  });
  describe('updateEmail', () => {
    it('should update isRead field', async () => {
      const created = await createTestEmail({
        threadId: `${TEST_PREFIX}-update-read`,
        isRead: false,
      });

      const updated = await updateEmail(created.id, { isRead: true });

      expect(updated).not.toBeNull();
      expect(updated!.isRead).toBe(true);
    });

    it('should update isImportant field', async () => {
      const created = await createTestEmail({
        threadId: `${TEST_PREFIX}-update-important`,
        isImportant: false,
      });

      const updated = await updateEmail(created.id, { isImportant: true });

      expect(updated).not.toBeNull();
      expect(updated!.isImportant).toBe(true);
    });

    it('should update both isRead and isImportant simultaneously', async () => {
      const created = await createTestEmail({
        threadId: `${TEST_PREFIX}-update-both`,
        isRead: false,
        isImportant: false,
      });

      const updated = await updateEmail(created.id, {
        isRead: true,
        isImportant: true,
      });

      expect(updated).not.toBeNull();
      expect(updated!.isRead).toBe(true);
      expect(updated!.isImportant).toBe(true);
    });

    it('should update updatedAt timestamp', async () => {
      // Create email with explicit past timestamp to avoid timing dependencies
      const pastTimestamp = Math.floor(Date.now() / 1000) - 60; // 60 seconds ago
      const [created] = await db
        .insert(emails)
        .values({
          threadId: `${TEST_PREFIX}-update-timestamp`,
          subject: 'Test Subject',
          from: 'sender@test.com',
          to: 'recipient@test.com',
          content: 'Test content',
          isRead: false,
          isImportant: false,
          isDeleted: false,
          direction: EmailDirection.INCOMING,
          createdAt: sql`${pastTimestamp}`,
          updatedAt: sql`${pastTimestamp}`,
        })
        .returning();

      const originalUpdatedAt = created.updatedAt;

      const updated = await updateEmail(created.id, { isRead: true });

      expect(updated).not.toBeNull();
      expect(updated!.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it('should return null when email does not exist', async () => {
      const nonExistentId = 999999999;

      const result = await updateEmail(nonExistentId, { isRead: true });

      expect(result).toBeNull();
    });

    it('should not modify other fields', async () => {
      const created = await createTestEmail({
        threadId: `${TEST_PREFIX}-update-preserve`,
        subject: 'Original Subject',
        content: 'Original Content',
        isRead: false,
        isImportant: false,
      });

      const updated = await updateEmail(created.id, { isRead: true });

      expect(updated!.subject).toBe('Original Subject');
      expect(updated!.content).toBe('Original Content');
      expect(updated!.threadId).toBe(created.threadId);
    });

    it('should handle empty update object', async () => {
      const created = await createTestEmail({
        threadId: `${TEST_PREFIX}-empty-update`,
        isRead: false,
        isImportant: false,
      });

      const updated = await updateEmail(created.id, {});

      expect(updated).not.toBeNull();
      expect(updated!.isRead).toBe(false);
      expect(updated!.isImportant).toBe(false);
    });

    it('should toggle isRead from true to false', async () => {
      const created = await createTestEmail({
        threadId: `${TEST_PREFIX}-toggle-read`,
        isRead: true,
      });

      const updated = await updateEmail(created.id, { isRead: false });

      expect(updated!.isRead).toBe(false);
    });

    it('should toggle isImportant from true to false', async () => {
      const created = await createTestEmail({
        threadId: `${TEST_PREFIX}-toggle-important`,
        isImportant: true,
      });

      const updated = await updateEmail(created.id, { isImportant: false });

      expect(updated!.isImportant).toBe(false);
    });
  });
  describe('deleteEmail', () => {
    it('should soft delete email by setting isDeleted to true', async () => {
      const created = await createTestEmail({
        threadId: `${TEST_PREFIX}-soft-delete`,
        isDeleted: false,
      });

      const result = await deleteEmail(created.id);

      expect(result).toBe(true);

      // Verify in database
      const [dbEmail] = await db
        .select()
        .from(emails)
        .where(eq(emails.id, created.id));
      expect(dbEmail.isDeleted).toBe(true);
    });

    it('should return true when email exists', async () => {
      const created = await createTestEmail({
        threadId: `${TEST_PREFIX}-delete-exists`,
      });

      const result = await deleteEmail(created.id);

      expect(result).toBe(true);
    });

    it('should return false when email does not exist', async () => {
      const nonExistentId = 999999999;

      const result = await deleteEmail(nonExistentId);

      expect(result).toBe(false);
    });

    it('should update updatedAt timestamp on delete', async () => {
      // Create email with explicit past timestamp to avoid timing dependencies
      const pastTimestamp = Math.floor(Date.now() / 1000) - 60; // 60 seconds ago
      const [created] = await db
        .insert(emails)
        .values({
          threadId: `${TEST_PREFIX}-delete-timestamp`,
          subject: 'Test Subject',
          from: 'sender@test.com',
          to: 'recipient@test.com',
          content: 'Test content',
          isRead: false,
          isImportant: false,
          isDeleted: false,
          direction: EmailDirection.INCOMING,
          createdAt: sql`${pastTimestamp}`,
          updatedAt: sql`${pastTimestamp}`,
        })
        .returning();

      const originalUpdatedAt = created.updatedAt;

      await deleteEmail(created.id);

      const [dbEmail] = await db
        .select()
        .from(emails)
        .where(eq(emails.id, created.id));
      expect(dbEmail.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime(),
      );
    });

    it('should not physically remove email from database', async () => {
      const created = await createTestEmail({
        threadId: `${TEST_PREFIX}-soft-not-hard`,
      });

      await deleteEmail(created.id);

      const [dbEmail] = await db
        .select()
        .from(emails)
        .where(eq(emails.id, created.id));
      expect(dbEmail).toBeDefined();
      expect(dbEmail.id).toBe(created.id);
    });

    it('should work on already deleted email (idempotent)', async () => {
      const created = await createTestEmail({
        threadId: `${TEST_PREFIX}-delete-twice`,
        isDeleted: true,
      });

      const result = await deleteEmail(created.id);

      expect(result).toBe(true);
    });
  });
  describe('deleteThread', () => {
    it('should soft delete all emails in a thread', async () => {
      const threadId = `${TEST_PREFIX}-delete-thread`;
      await createTestThread(threadId, 3, { isDeleted: false });

      const result = await deleteThread(threadId);

      expect(result).toBe(true);

      // Verify all emails in thread are deleted
      const threadEmails = await db
        .select()
        .from(emails)
        .where(eq(emails.threadId, threadId));

      expect(threadEmails.length).toBe(3);
      threadEmails.forEach((email) => {
        expect(email.isDeleted).toBe(true);
      });
    });

    it('should return true when thread exists', async () => {
      const threadId = `${TEST_PREFIX}-delete-thread-exists`;
      await createTestEmail({ threadId });

      const result = await deleteThread(threadId);

      expect(result).toBe(true);
    });

    it('should return false when thread does not exist', async () => {
      const nonExistentThreadId = `non-existent-thread-${Date.now()}`;

      const result = await deleteThread(nonExistentThreadId);

      expect(result).toBe(false);
    });

    it('should update updatedAt for all emails in thread', async () => {
      const threadId = `${TEST_PREFIX}-thread-timestamp`;
      const threadEmails = await createTestThread(threadId, 2);
      const originalTimesById = new Map(
        threadEmails.map((e) => [e.id, e.updatedAt.getTime()]),
      );

      await new Promise((resolve) => setTimeout(resolve, 1100));

      await deleteThread(threadId);

      const updatedEmails = await db
        .select()
        .from(emails)
        .where(eq(emails.threadId, threadId));

      updatedEmails.forEach((email) => {
        const originalTime = originalTimesById.get(email.id)!;
        expect(email.updatedAt.getTime()).toBeGreaterThan(originalTime);
      });
    });

    it('should not affect emails in other threads', async () => {
      const targetThreadId = `${TEST_PREFIX}-target-thread`;
      const otherThreadId = `${TEST_PREFIX}-other-thread`;

      await createTestEmail({ threadId: targetThreadId, isDeleted: false });
      await createTestEmail({ threadId: otherThreadId, isDeleted: false });

      await deleteThread(targetThreadId);

      const [otherEmail] = await db
        .select()
        .from(emails)
        .where(eq(emails.threadId, otherThreadId));

      expect(otherEmail.isDeleted).toBe(false);
    });

    it('should handle thread with single email', async () => {
      const threadId = `${TEST_PREFIX}-single-email-thread`;
      await createTestEmail({ threadId, isDeleted: false });

      const result = await deleteThread(threadId);

      expect(result).toBe(true);

      const [email] = await db
        .select()
        .from(emails)
        .where(eq(emails.threadId, threadId));
      expect(email.isDeleted).toBe(true);
    });

    it('should be atomic (all or nothing)', async () => {
      const threadId = `${TEST_PREFIX}-atomic-thread`;
      await createTestThread(threadId, 5, { isDeleted: false });

      const result = await deleteThread(threadId);

      expect(result).toBe(true);

      // All emails should be in same state
      const threadEmails = await db
        .select()
        .from(emails)
        .where(eq(emails.threadId, threadId));

      const allDeleted = threadEmails.every((e) => e.isDeleted === true);
      const noneDeleted = threadEmails.every((e) => e.isDeleted === false);

      expect(allDeleted || noneDeleted).toBe(true);
      expect(allDeleted).toBe(true);
    });
  });
  describe('restoreThread', () => {
    it('should restore all emails in a deleted thread', async () => {
      const threadId = `${TEST_PREFIX}-restore-thread`;
      await createTestThread(threadId, 3, { isDeleted: true });

      const result = await restoreThread(threadId);

      expect(result).toBe(true);

      const threadEmails = await db
        .select()
        .from(emails)
        .where(eq(emails.threadId, threadId));

      threadEmails.forEach((email) => {
        expect(email.isDeleted).toBe(false);
      });
    });

    it('should return true when thread exists', async () => {
      const threadId = `${TEST_PREFIX}-restore-exists`;
      await createTestEmail({ threadId, isDeleted: true });

      const result = await restoreThread(threadId);

      expect(result).toBe(true);
    });

    it('should return false when thread does not exist', async () => {
      const nonExistentThreadId = `non-existent-restore-${Date.now()}`;

      const result = await restoreThread(nonExistentThreadId);

      expect(result).toBe(false);
    });

    it('should update updatedAt for all emails in thread', async () => {
      const threadId = `${TEST_PREFIX}-restore-timestamp`;
      const threadEmails = await createTestThread(threadId, 2, {
        isDeleted: true,
      });
      const originalTimesById = new Map(
        threadEmails.map((e) => [e.id, e.updatedAt.getTime()]),
      );

      await new Promise((resolve) => setTimeout(resolve, 1100));

      await restoreThread(threadId);

      const updatedEmails = await db
        .select()
        .from(emails)
        .where(eq(emails.threadId, threadId));

      updatedEmails.forEach((email) => {
        const originalTime = originalTimesById.get(email.id)!;
        expect(email.updatedAt.getTime()).toBeGreaterThan(originalTime);
      });
    });

    it('should work on non-deleted thread (idempotent)', async () => {
      const threadId = `${TEST_PREFIX}-restore-not-deleted`;
      await createTestEmail({ threadId, isDeleted: false });

      const result = await restoreThread(threadId);

      expect(result).toBe(true);

      const [email] = await db
        .select()
        .from(emails)
        .where(eq(emails.threadId, threadId));
      expect(email.isDeleted).toBe(false);
    });

    it('should not affect emails in other threads', async () => {
      const targetThreadId = `${TEST_PREFIX}-restore-target`;
      const otherThreadId = `${TEST_PREFIX}-restore-other`;

      await createTestEmail({ threadId: targetThreadId, isDeleted: true });
      await createTestEmail({ threadId: otherThreadId, isDeleted: true });

      await restoreThread(targetThreadId);

      const [otherEmail] = await db
        .select()
        .from(emails)
        .where(eq(emails.threadId, otherThreadId));

      expect(otherEmail.isDeleted).toBe(true);
    });

    it('should be atomic (all or nothing)', async () => {
      const threadId = `${TEST_PREFIX}-restore-atomic`;
      await createTestThread(threadId, 5, { isDeleted: true });

      const result = await restoreThread(threadId);

      expect(result).toBe(true);

      const threadEmails = await db
        .select()
        .from(emails)
        .where(eq(emails.threadId, threadId));

      const allRestored = threadEmails.every((e) => e.isDeleted === false);
      expect(allRestored).toBe(true);
    });
  });
  describe('permanentlyDeleteThread', () => {
    it('should physically remove all emails in a thread from database', async () => {
      const threadId = `${TEST_PREFIX}-perm-delete`;
      await createTestThread(threadId, 3);

      // Verify emails exist
      const beforeDelete = await db
        .select()
        .from(emails)
        .where(eq(emails.threadId, threadId));
      expect(beforeDelete.length).toBe(3);

      const result = await permanentlyDeleteThread(threadId);

      expect(result).toBe(true);

      const afterDelete = await db
        .select()
        .from(emails)
        .where(eq(emails.threadId, threadId));
      expect(afterDelete.length).toBe(0);
    });

    it('should return true when thread exists', async () => {
      const threadId = `${TEST_PREFIX}-perm-exists`;
      await createTestEmail({ threadId });

      const result = await permanentlyDeleteThread(threadId);

      expect(result).toBe(true);
    });

    it('should return false when thread does not exist', async () => {
      const nonExistentThreadId = `non-existent-perm-${Date.now()}`;

      const result = await permanentlyDeleteThread(nonExistentThreadId);

      expect(result).toBe(false);
    });

    it('should not affect emails in other threads', async () => {
      const targetThreadId = `${TEST_PREFIX}-perm-target`;
      const otherThreadId = `${TEST_PREFIX}-perm-other`;

      await createTestEmail({ threadId: targetThreadId });
      await createTestEmail({ threadId: otherThreadId });

      await permanentlyDeleteThread(targetThreadId);

      const [otherEmail] = await db
        .select()
        .from(emails)
        .where(eq(emails.threadId, otherThreadId));

      expect(otherEmail).toBeDefined();
    });

    it('should handle thread with single email', async () => {
      const threadId = `${TEST_PREFIX}-perm-single`;
      await createTestEmail({ threadId });

      const result = await permanentlyDeleteThread(threadId);

      expect(result).toBe(true);

      const afterDelete = await db
        .select()
        .from(emails)
        .where(eq(emails.threadId, threadId));
      expect(afterDelete.length).toBe(0);
    });

    it('should be atomic (all or nothing)', async () => {
      const threadId = `${TEST_PREFIX}-perm-atomic`;
      await createTestThread(threadId, 5);

      const result = await permanentlyDeleteThread(threadId);

      expect(result).toBe(true);

      // Either all deleted or none
      const afterDelete = await db
        .select()
        .from(emails)
        .where(eq(emails.threadId, threadId));
      expect(afterDelete.length).toBe(0);
    });

    it('should work on already soft-deleted emails', async () => {
      const threadId = `${TEST_PREFIX}-perm-soft-first`;
      await createTestThread(threadId, 2, { isDeleted: true });

      const result = await permanentlyDeleteThread(threadId);

      expect(result).toBe(true);

      const afterDelete = await db
        .select()
        .from(emails)
        .where(eq(emails.threadId, threadId));
      expect(afterDelete.length).toBe(0);
    });

    it('should handle mixed deleted/non-deleted emails in thread', async () => {
      const threadId = `${TEST_PREFIX}-perm-mixed`;
      await createTestEmail({ threadId, isDeleted: false });
      await createTestEmail({ threadId, isDeleted: true });

      const result = await permanentlyDeleteThread(threadId);

      expect(result).toBe(true);

      const afterDelete = await db
        .select()
        .from(emails)
        .where(eq(emails.threadId, threadId));
      expect(afterDelete.length).toBe(0);
    });
  });
  describe('edge cases', () => {
    it('should handle concurrent operations on same thread', async () => {
      const threadId = `${TEST_PREFIX}-concurrent`;
      await createTestThread(threadId, 3);

      const [deleteResult, , restoreResult] = await Promise.all([
        deleteThread(threadId),
        new Promise((resolve) => setTimeout(resolve, 10)), // Small delay
        restoreThread(threadId),
      ]);

      expect(deleteResult).toBe(true);
      expect(restoreResult).toBe(true);
    });

    it('should handle emails with null content', async () => {
      const created = await createTestEmail({
        threadId: `${TEST_PREFIX}-null-content`,
        content: null,
      });

      const result = await getEmailById(created.id);

      expect(result!.content).toBeNull();
    });

    it('should handle emails with empty string content', async () => {
      const [created] = await db
        .insert(emails)
        .values({
          threadId: `${TEST_PREFIX}-empty-content`,
          subject: 'Test',
          from: 'from@test.com',
          to: 'to@test.com',
          content: '',
          direction: EmailDirection.INCOMING,
        })
        .returning();

      const result = await getEmailById(created.id);

      expect(result!.content).toBe('');
    });

    it('should handle special characters in search', async () => {
      const specialSubject = 'Test with special chars: !@#$%^&*()';
      await createTestEmail({
        threadId: `${TEST_PREFIX}-special-chars`,
        subject: specialSubject,
      });

      const result = await getEmails({ search: 'special chars' });

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
    });

    it('should handle very long subject in search', async () => {
      const longSubject = 'A'.repeat(500);
      await createTestEmail({
        threadId: `${TEST_PREFIX}-long-subject`,
        subject: longSubject,
      });

      const result = await getEmails({ search: 'AAAA' });

      expect(result).toBeDefined();
    });

    it('should correctly convert timestamps from SQLite to JavaScript Dates', async () => {
      const created = await createTestEmail({
        threadId: `${TEST_PREFIX}-timestamp-conversion`,
      });

      const result = await getEmailById(created.id);

      expect(result!.createdAt).toBeInstanceOf(Date);
      expect(result!.updatedAt).toBeInstanceOf(Date);
      // Timestamps should be reasonable (within last minute)
      const now = Date.now();
      expect(result!.createdAt.getTime()).toBeLessThanOrEqual(now + 1000);
      expect(result!.createdAt.getTime()).toBeGreaterThan(now - 60000);
    });

    it('should return empty results for very large page number', async () => {
      const veryLargePage = 999999;

      const result = await getEmails({ page: veryLargePage });

      expect(result.data).toHaveLength(0);
      expect(result.pagination.page).toBe(veryLargePage);
    });
  });
});
