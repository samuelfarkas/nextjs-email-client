import { NextRequest } from 'next/server';
import { GET, POST } from './route';
import { Email, EmailDirection, emails } from '@/lib/schema';
import { db } from '@/lib/database';
import { eq } from 'drizzle-orm';
import { PaginatedResult } from '@/services/emailService';

describe('emails API', () => {
  describe('POST /api/emails', () => {
    it('Creates a new email and writes it to the database', async () => {
      const emailData = {
        subject: 'Test Email',
        to: 'test@test.com',
        content: 'Test content',
        threadId: '550e8400-e29b-41d4-a716-446655440000',
      };

      const request = new NextRequest('http://localhost:3000/api/emails', {
        method: 'POST',
        body: JSON.stringify(emailData),
      });

      const response = await POST(request);
      expect(response.status).toBe(201);

      const returnedEmail = (await response.json()) as Email;

      expect(returnedEmail.id).toBeDefined();
      expect(returnedEmail.subject).toBe(emailData.subject);
      expect(returnedEmail.to).toBe(emailData.to);
      expect(returnedEmail.content).toBe(emailData.content);
      expect(returnedEmail.threadId).toBe(emailData.threadId);
      expect(returnedEmail.from).toBe('user@example.com'); // Set by server (CURRENT_USER_EMAIL)
      expect(returnedEmail.direction).toBe(EmailDirection.OUTGOING); // Set by server

      // Make sure the email was added to the database
      const databaseEntry = await db
        .select()
        .from(emails)
        .where(eq(emails.id, returnedEmail.id));

      // The entries should match
      expect(JSON.stringify(returnedEmail)).toEqual(
        JSON.stringify(databaseEntry[0]),
      );
    });
  });

  describe('GET /api/emails', () => {
    it('Returns all emails when no search is provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/emails', {
        method: 'GET',
      });

      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it('Returns emails that match the search term', async () => {
      // Create test data with a known search term
      const searchTerm = 'Planning';
      const testEmail = {
        subject: `${searchTerm} for Q4`,
        to: 'test@test.com',
        content: 'Test content for search',
        threadId: 'search-test-thread',
      };

      // Create the test email first
      const createRequest = new NextRequest(
        'http://localhost:3000/api/emails',
        {
          method: 'POST',
          body: JSON.stringify(testEmail),
        },
      );
      await POST(createRequest);

      const request = new NextRequest(
        'http://localhost:3000/api/emails?search=' + searchTerm,
        {
          method: 'GET',
        },
      );

      const response = await GET(request);

      const result = (await response.json()) as PaginatedResult<Email>;
      const returnedEmails = result.data;

      // Verify we got results
      expect(returnedEmails.length).toBeGreaterThan(0);

      // Verify all returned emails contain the search term in subject, from, to, or content
      // FTS5 does prefix matching with wildcard, so check if any field contains terms starting with search
      returnedEmails.forEach((email) => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          email.subject?.toLowerCase().includes(searchLower) ||
          email.from?.toLowerCase().includes(searchLower) ||
          email.to?.toLowerCase().includes(searchLower) ||
          email.content?.toLowerCase().includes(searchLower);
        expect(matchesSearch).toBe(true);
      });
    });
  });
});
