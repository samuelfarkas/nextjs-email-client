import { z } from 'zod/v4';
import { emailIdSchema, booleanStringSchema } from './primitives';

// Path params for /api/emails/[id]
export const emailIdParamSchema = z.object({
  id: emailIdSchema,
});
export type EmailIdParam = z.infer<typeof emailIdParamSchema>;

// Path params for /api/emails/thread/[threadId]
export const threadIdParamSchema = z.object({
  threadId: z.string().min(1, 'Thread ID is required'),
});
export type ThreadIdParam = z.infer<typeof threadIdParamSchema>;

// DELETE /api/emails/thread/[threadId] query params
export const deleteThreadQuerySchema = z.object({
  permanent: booleanStringSchema.optional(),
});
export type DeleteThreadQuery = z.infer<typeof deleteThreadQuerySchema>;
