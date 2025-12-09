import { NextRequest } from 'next/server';
import {
  getEmailById,
  updateEmail,
  deleteEmail,
} from '@/services/emailService';
import {
  emailIdParamSchema,
  updateEmailSchema,
  validateParams,
  validateBody,
} from '@/lib/validations';
import { withApiHandler, parseJson } from '@/lib/api/handler';
import { Errors, ServiceError } from '@/lib/errors/ServiceError';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withApiHandler(async () => {
    const rawParams = await params;

    const validation = validateParams(emailIdParamSchema, rawParams);
    if (!validation.success) {
      throw new ServiceError('Invalid email ID', 'VALIDATION_ERROR', 400);
    }

    const email = await getEmailById(validation.data.id);

    if (!email) {
      throw Errors.notFound('Email');
    }

    return email;
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withApiHandler(async () => {
    const rawParams = await params;

    const validation = validateParams(emailIdParamSchema, rawParams);
    if (!validation.success) {
      throw new ServiceError('Invalid email ID', 'VALIDATION_ERROR', 400);
    }

    const deleted = await deleteEmail(validation.data.id);

    if (!deleted) {
      throw Errors.notFound('Email');
    }

    return { success: true };
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  return withApiHandler(async () => {
    const rawParams = await params;

    const paramValidation = validateParams(emailIdParamSchema, rawParams);
    if (!paramValidation.success) {
      throw new ServiceError('Invalid email ID', 'VALIDATION_ERROR', 400);
    }

    const body = await parseJson(req);

    const bodyValidation = validateBody(updateEmailSchema, body);
    if (!bodyValidation.success) {
      throw new ServiceError('Invalid request body', 'VALIDATION_ERROR', 400);
    }

    const updated = await updateEmail(
      paramValidation.data.id,
      bodyValidation.data,
    );

    if (!updated) {
      throw Errors.notFound('Email');
    }

    return updated;
  });
}
