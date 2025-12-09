import { z } from 'zod/v4';
import { emailFilterSchema } from './validations/email';

// Single source of truth for email list URL params
export const emailListParamsSchema = z.object({
  filter: emailFilterSchema.default('inbox'),
  page: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type EmailListParams = z.infer<typeof emailListParamsSchema>;

// Defaults exported for components that need them
export const EMAIL_LIST_DEFAULTS: EmailListParams = {
  filter: 'inbox',
  page: 0,
  pageSize: 20,
};

// Parse searchParams in server components
export function parseEmailListParams(
  searchParams: Record<string, string | string[] | undefined>,
): EmailListParams {
  const raw = Object.fromEntries(
    Object.entries(searchParams).map(([k, v]) => [
      k,
      Array.isArray(v) ? v[0] : v,
    ]),
  );
  return emailListParamsSchema.parse(raw);
}
