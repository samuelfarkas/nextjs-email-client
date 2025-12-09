import { NextRequest } from 'next/server';
import {
  deleteThread,
  restoreThread,
  permanentlyDeleteThread,
} from '@/services/emailService';
import {
  threadIdParamSchema,
  deleteThreadQuerySchema,
  restoreThreadSchema,
  validateParams,
  validateQuery,
  validateBody,
} from '@/lib/validations';
import { withApiHandler, parseJson } from '@/lib/api/handler';
import { ServiceError } from '@/lib/errors/ServiceError';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
): Promise<Response> {
  return withApiHandler(async () => {
    const rawParams = await params;

    const paramValidation = validateParams(threadIdParamSchema, rawParams);
    if (!paramValidation.success) {
      throw new ServiceError('Invalid thread ID', 'VALIDATION_ERROR', 400);
    }

    const url = new URL(req.url);
    const queryValidation = validateQuery(
      deleteThreadQuerySchema,
      url.searchParams,
    );
    if (!queryValidation.success) {
      throw new ServiceError(
        'Invalid query parameters',
        'VALIDATION_ERROR',
        400,
      );
    }

    const { threadId } = paramValidation.data;
    const permanent = queryValidation.data.permanent ?? false;

    const success = permanent
      ? await permanentlyDeleteThread(threadId)
      : await deleteThread(threadId);

    if (!success) {
      throw new ServiceError('Thread not found', 'NOT_FOUND', 404);
    }

    return { success: true };
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
): Promise<Response> {
  return withApiHandler(async () => {
    const rawParams = await params;

    const paramValidation = validateParams(threadIdParamSchema, rawParams);
    if (!paramValidation.success) {
      throw new ServiceError('Invalid thread ID', 'VALIDATION_ERROR', 400);
    }

    const body = await parseJson(req);

    const bodyValidation = validateBody(restoreThreadSchema, body);
    if (!bodyValidation.success) {
      throw new ServiceError('Invalid request body', 'VALIDATION_ERROR', 400);
    }

    const success = await restoreThread(paramValidation.data.threadId);

    if (!success) {
      throw new ServiceError('Thread not found', 'NOT_FOUND', 404);
    }

    // Return consistent response format with threadId
    return { threadId: paramValidation.data.threadId, restored: true };
  });
}
