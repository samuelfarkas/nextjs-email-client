import { ServiceError } from '@/lib/errors/ServiceError';

type ApiHandler<T> = () => Promise<T>;

export async function withApiHandler<T>(
  handler: ApiHandler<T>,
): Promise<Response> {
  try {
    const result = await handler();
    return Response.json(result);
  } catch (error) {
    if (error instanceof ServiceError) {
      return Response.json(error.toJSON(), { status: error.statusCode });
    }

    console.error('[API Error]', error);
    return Response.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

export async function parseJson<T>(req: Request): Promise<T> {
  try {
    return await req.json();
  } catch {
    throw new ServiceError('Invalid JSON in request body', 'INVALID_JSON', 400);
  }
}

// Helper for 204 No Content responses
export function noContent(): Response {
  return new Response(null, { status: 204 });
}

// Helper for 201 Created responses
export function created<T>(data: T): Response {
  return Response.json(data, { status: 201 });
}

// Helper for 404 Not Found responses
export function notFound(message: string = 'Resource not found'): Response {
  return Response.json({ error: message, code: 'NOT_FOUND' }, { status: 404 });
}
