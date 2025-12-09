export class ServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'ServiceError';
    // Maintains proper stack trace for where the error was thrown
    Error.captureStackTrace?.(this, ServiceError);
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
    };
  }
}

// Common error factories for reuse
export const Errors = {
  notFound: (resource: string) =>
    new ServiceError(`${resource} not found`, 'NOT_FOUND', 404),

  invalidInput: (message: string) =>
    new ServiceError(message, 'INVALID_INPUT', 400),

  database: (message: string = 'Database operation failed') =>
    new ServiceError(message, 'DB_ERROR', 500),

  internal: (message: string = 'Internal server error') =>
    new ServiceError(message, 'INTERNAL_ERROR', 500),
} as const;
