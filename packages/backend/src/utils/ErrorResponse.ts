import { Response } from 'express';
import { HTTP_STATUS } from '@swistack/shared';

export interface ErrorDetails {
  field?: string;
  code?: string;
  message?: string;
}

export interface StandardErrorResponse {
  success: false;
  error: string;
  code?: string;
  timestamp: string;
  path?: string;
  details?: ErrorDetails[] | Record<string, any>;
  stack?: string;
}

export class ErrorResponseUtil {
  private static isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
  }

  static sendError(
    res: Response,
    statusCode: number,
    message: string,
    options?: {
      code?: string;
      details?: ErrorDetails[] | Record<string, any>;
      error?: Error;
      path?: string;
    }
  ): void {
    const response: StandardErrorResponse = {
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    };

    if (options?.code) {
      response.code = options.code;
    }

    if (options?.path) {
      response.path = options.path;
    }

    if (options?.details) {
      response.details = options.details;
    }

    // Include stack trace in development
    if (this.isDevelopment() && options?.error) {
      response.stack = options.error.stack;
    }

    res.status(statusCode).json(response);
  }

  // Common error responses
  static badRequest(
    res: Response, 
    message: string = 'Bad request',
    options?: {
      code?: string;
      details?: ErrorDetails[] | Record<string, any>;
      path?: string;
    }
  ): void {
    this.sendError(res, HTTP_STATUS.BAD_REQUEST, message, options);
  }

  static unauthorized(
    res: Response,
    message: string = 'Authentication required',
    options?: {
      code?: string;
      path?: string;
    }
  ): void {
    this.sendError(res, HTTP_STATUS.UNAUTHORIZED, message, options);
  }

  static forbidden(
    res: Response,
    message: string = 'Access denied',
    options?: {
      code?: string;
      path?: string;
    }
  ): void {
    this.sendError(res, HTTP_STATUS.FORBIDDEN, message, options);
  }

  static notFound(
    res: Response,
    message: string = 'Resource not found',
    options?: {
      code?: string;
      path?: string;
    }
  ): void {
    this.sendError(res, HTTP_STATUS.NOT_FOUND, message, options);
  }

  static conflict(
    res: Response,
    message: string = 'Resource conflict',
    options?: {
      code?: string;
      details?: ErrorDetails[] | Record<string, any>;
      path?: string;
    }
  ): void {
    this.sendError(res, HTTP_STATUS.CONFLICT, message, options);
  }

  static unprocessableEntity(
    res: Response,
    message: string = 'Validation failed',
    options?: {
      code?: string;
      details?: ErrorDetails[] | Record<string, any>;
      path?: string;
    }
  ): void {
    this.sendError(res, HTTP_STATUS.UNPROCESSABLE_ENTITY, message, options);
  }

  static tooManyRequests(
    res: Response,
    message: string = 'Too many requests',
    options?: {
      code?: string;
      retryAfter?: number;
      path?: string;
    }
  ): void {
    if (options?.retryAfter) {
      res.setHeader('Retry-After', options.retryAfter);
    }
    this.sendError(res, HTTP_STATUS.TOO_MANY_REQUESTS, message, {
      code: options?.code,
      path: options?.path,
    });
  }

  static internalServerError(
    res: Response,
    message: string = 'Internal server error',
    options?: {
      code?: string;
      error?: Error;
      path?: string;
    }
  ): void {
    this.sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, message, options);
  }

  static serviceUnavailable(
    res: Response,
    message: string = 'Service temporarily unavailable',
    options?: {
      code?: string;
      retryAfter?: number;
      path?: string;
    }
  ): void {
    if (options?.retryAfter) {
      res.setHeader('Retry-After', options.retryAfter);
    }
    this.sendError(res, HTTP_STATUS.SERVICE_UNAVAILABLE, message, {
      code: options?.code,
      path: options?.path,
    });
  }

  // Storage-specific errors
  static storageQuotaExceeded(
    res: Response,
    message: string,
    details?: {
      currentUsage?: number;
      limit?: number;
      additionalSize?: number;
    }
  ): void {
    this.sendError(res, HTTP_STATUS.BAD_REQUEST, message, {
      code: 'STORAGE_QUOTA_EXCEEDED',
      details,
    });
  }

  // Validation error helper
  static validationError(
    res: Response,
    message: string = 'Validation failed',
    errors: ErrorDetails[]
  ): void {
    this.sendError(res, HTTP_STATUS.BAD_REQUEST, message, {
      code: 'VALIDATION_ERROR',
      details: errors,
    });
  }

  // Database error helper
  static databaseError(
    res: Response,
    error: Error,
    operation: string = 'database operation'
  ): void {
    const isDev = this.isDevelopment();
    const message = isDev 
      ? `Database error during ${operation}: ${error.message}`
      : `Failed to complete ${operation}`;

    this.sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, message, {
      code: 'DATABASE_ERROR',
      error: isDev ? error : undefined,
    });
  }

  // Permission error helper
  static insufficientPermissions(
    res: Response,
    requiredRole?: string,
    currentRole?: string
  ): void {
    const message = requiredRole 
      ? `Insufficient permissions. Required: ${requiredRole}${currentRole ? `, Current: ${currentRole}` : ''}`
      : 'Insufficient permissions';

    this.sendError(res, HTTP_STATUS.FORBIDDEN, message, {
      code: 'INSUFFICIENT_PERMISSIONS',
      details: {
        requiredRole,
        currentRole,
      },
    });
  }
}