import { Errors, ServiceError } from './errors/ServiceError';

export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof ServiceError) {
      throw error;
    }
    console.error(`[${context}]`, error);
    throw Errors.database(`Operation failed: ${context}`);
  }
}
