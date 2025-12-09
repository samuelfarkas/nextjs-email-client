import { z } from 'zod/v4';

// Helper: validates comma-separated email string
const commaSeparatedEmailsSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val || val === '') return true;
      const emails = val.split(',').map((e) => e.trim());
      return emails.every((email) => z.email().safeParse(email).success);
    },
    { message: 'Invalid email address' },
  );

// Email filter enum
export const emailFilterSchema = z.enum([
  'inbox',
  'sent',
  'important',
  'trash',
]);
export type EmailFilter = z.infer<typeof emailFilterSchema>;

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(0).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});
export type PaginationQuery = z.infer<typeof paginationSchema>;

// GET /api/emails query params
export const getEmailsQuerySchema = z.object({
  search: z
    .string()
    .max(200)
    .optional()
    .refine((val) => !val || val.length >= 3, {
      message: 'Search must be at least 3 characters',
    }),
  filter: emailFilterSchema.optional(),
  threadId: z.string().optional(),
  threadOnly: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});
export type GetEmailsQuery = z.infer<typeof getEmailsQuerySchema>;

// POST /api/emails - create email
export const createEmailSchema = z.object({
  to: z.email(),
  cc: commaSeparatedEmailsSchema,
  bcc: commaSeparatedEmailsSchema,
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(500, 'Subject too long'),
  content: z.string().max(50000, 'Content too long').optional(),
  threadId: z.string().optional(),
});
export type CreateEmailInput = z.infer<typeof createEmailSchema>;

// PATCH /api/emails/[id] - update email
export const updateEmailSchema = z.object({
  isRead: z.boolean().optional(),
  isImportant: z.boolean().optional(),
});
export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;

// PATCH /api/emails/thread/[threadId] - restore thread
export const restoreThreadSchema = z.object({
  restore: z.literal(true),
});
export type RestoreThreadInput = z.infer<typeof restoreThreadSchema>;
