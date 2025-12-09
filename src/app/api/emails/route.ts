import { NextRequest } from 'next/server';
import { getEmails, createEmail } from '@/services/emailService';
import {
  getEmailsQuerySchema,
  createEmailSchema,
  validateBody,
  validateQuery,
} from '@/lib/validations';
import { withApiHandler, parseJson, created } from '@/lib/api/handler';
import { ServiceError } from '@/lib/errors/ServiceError';

export async function GET(req: NextRequest): Promise<Response> {
  return withApiHandler(async () => {
    const { searchParams } = new URL(req.url);

    const validation = validateQuery(getEmailsQuerySchema, searchParams);
    if (!validation.success) {
      throw new ServiceError(
        'Invalid query parameters',
        'VALIDATION_ERROR',
        400,
      );
    }

    // Extract pagination params
    const page = searchParams.get('page');
    const pageSize = searchParams.get('pageSize');

    return getEmails({
      ...validation.data,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  const body = await parseJson(req);

  const validation = validateBody(createEmailSchema, body);
  if (!validation.success) {
    return validation.error;
  }

  const newEmail = await createEmail(validation.data);
  return created(newEmail);
}
