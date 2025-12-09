import { z } from 'zod/v4';

export const emailAddressSchema = z.email();

export const emailIdSchema = z.coerce.number().int().positive();

export const threadIdSchema = z.uuid();
export const threadIdOptionalSchema = z.uuid().optional();

export const booleanStringSchema = z
  .enum(['true', 'false'])
  .transform((val) => val === 'true');

export const pageSchema = z.coerce.number().int().min(1).default(1);
export const pageSizeSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(100)
  .default(20);
