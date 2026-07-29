export type ErrorCategory =
  | 'OFFLINE'
  | 'UNCONFIGURED_PROVIDER'
  | 'INVALID_API_KEY'
  | 'RATE_LIMITED'
  | 'NO_RESULTS'
  | 'NETWORK_ERROR'
  | 'PROVIDER_UNAVAILABLE'
  | 'NOT_FOUND'
  | 'AUTH_REQUIRED'
  | 'VALIDATION_FAILED'
  | 'SERVER_ERROR'
  | 'TIMEOUT'
  | 'AI_NOT_IMPLEMENTED'
  | 'BYOK_KEY_REQUIRED'
  | 'AI_EXECUTION_FAILED'
  | 'UNKNOWN_ERROR';


export class AppError extends Error {
  public readonly code: ErrorCategory;
  public readonly userMessage: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCategory,
    userMessage: string,
    statusCode: number = 400,
    details?: Record<string, unknown>
  ) {
    super(userMessage);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.statusCode = statusCode;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
  }

  public static offline(): AppError {
    return new AppError(
      'OFFLINE',
      'Unable to connect. Please check your internet connection.',
      503
    );
  }

  public static unconfiguredProvider(providerName: string): AppError {
    return new AppError(
      'UNCONFIGURED_PROVIDER',
      `${providerName} is not configured. You can still create this resource manually.`,
      400
    );
  }

  public static invalidApiKey(providerName: string = 'Provider'): AppError {
    return new AppError(
      'INVALID_API_KEY',
      `Invalid API key for ${providerName}. Please check your credentials and try again.`,
      401
    );
  }

  public static noResults(query: string = ''): AppError {
    return new AppError(
      'NO_RESULTS',
      `No results found${query ? ` for "${query}"` : ''}. Try another search or create it manually.`,
      404
    );
  }

  public static networkError(providerName: string = 'Provider'): AppError {
    return new AppError(
      'NETWORK_ERROR',
      `Unable to reach ${providerName}. Please check your connection or try again.`,
      503
    );
  }

  public static providerUnavailable(providerName: string = 'Provider'): AppError {
    return new AppError(
      'PROVIDER_UNAVAILABLE',
      `${providerName} is temporarily unavailable. You can still create this resource manually.`,
      503
    );
  }

  public static notFound(resourceName: string = 'Resource'): AppError {
    return new AppError(
      'NOT_FOUND',
      `${resourceName} not found. Try another search or create it manually.`,
      404
    );
  }

  public static authRequired(): AppError {
    return new AppError(
      'AUTH_REQUIRED',
      'This action requires authentication. Please sign in again.',
      401
    );
  }

  public static validationFailed(message: string): AppError {
    return new AppError('VALIDATION_FAILED', message, 422);
  }

  public static serverError(message: string = 'Unable to save changes. Nothing was lost. Please try again.'): AppError {
    return new AppError('SERVER_ERROR', message, 500);
  }

  public static rateLimited(providerName: string): AppError {
    return new AppError(
      'RATE_LIMITED',
      `${providerName} rate limit exceeded. Stored metadata is still available.`,
      429
    );
  }

  public static timeout(): AppError {
    return new AppError(
      'TIMEOUT',
      'Request timed out. Please try again.',
      408
    );
  }

  public static fromError(err: unknown): AppError {
    if (err instanceof AppError) return err;
    if (err instanceof Error) {
      if (err.message.includes('offline') || err.message.includes('network') || err.message.includes('FetchError')) {
        return AppError.offline();
      }
      return new AppError(
        'UNKNOWN_ERROR',
        'Something went wrong. Please try again.',
        500,
        { originalMessage: err.message }
      );
    }
    return new AppError(
      'UNKNOWN_ERROR',
      'An unexpected error occurred. Please try again.',
      500
    );
  }
}
