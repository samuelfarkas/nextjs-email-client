// Primitives
export {
  emailAddressSchema,
  emailIdSchema,
  threadIdSchema,
  threadIdOptionalSchema,
  booleanStringSchema,
  pageSchema,
  pageSizeSchema,
} from './primitives';

// Email schemas and types
export {
  emailFilterSchema,
  type EmailFilter,
  paginationSchema,
  type PaginationQuery,
  getEmailsQuerySchema,
  type GetEmailsQuery,
  createEmailSchema,
  type CreateEmailInput,
  updateEmailSchema,
  type UpdateEmailInput,
  restoreThreadSchema,
  type RestoreThreadInput,
} from './email';

// API schemas and types
export {
  emailIdParamSchema,
  type EmailIdParam,
  threadIdParamSchema,
  type ThreadIdParam,
  deleteThreadQuerySchema,
  type DeleteThreadQuery,
} from './api';

// Helpers
export { validateBody, validateQuery, validateParams } from './helpers';
