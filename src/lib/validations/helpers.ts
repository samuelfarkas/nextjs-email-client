import { z } from 'zod/v4';

type ValidationSuccess<T> = {
  success: true;
  data: T;
};

type ValidationError = {
  success: false;
  error: Response;
};

type ValidationResult<T> = ValidationSuccess<T> | ValidationError;

function formatZodError(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || '_root';
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }
  return fieldErrors;
}

export function validateBody<T extends z.ZodType>(
  schema: T,
  body: unknown,
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: Response.json(
        {
          error: 'Validation failed',
          details: formatZodError(result.error),
        },
        { status: 400 },
      ),
    };
  }

  return { success: true, data: result.data };
}

export function validateQuery<T extends z.ZodType>(
  schema: T,
  searchParams: URLSearchParams,
): ValidationResult<z.infer<T>> {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  const result = schema.safeParse(params);

  if (!result.success) {
    return {
      success: false,
      error: Response.json(
        {
          error: 'Invalid query parameters',
          details: formatZodError(result.error),
        },
        { status: 400 },
      ),
    };
  }

  return { success: true, data: result.data };
}

export function validateParams<T extends z.ZodType>(
  schema: T,
  params: Record<string, string>,
): ValidationResult<z.infer<T>> {
  const result = schema.safeParse(params);

  if (!result.success) {
    return {
      success: false,
      error: Response.json(
        {
          error: 'Invalid path parameters',
          details: formatZodError(result.error),
        },
        { status: 400 },
      ),
    };
  }

  return { success: true, data: result.data };
}
