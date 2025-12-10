import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/http.js';
import { logger } from '../utils/logger.js';

/**
 * Global error handling middleware
 * Catches all errors and returns appropriate responses
 */
export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error
  logger.error(
    {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      requestId: res.locals.requestId,
    },
    'Request error'
  );

  // Handle known application errors
  if (error instanceof AppError) {
    sendError(res, error.message, error.statusCode, error.code);
    return;
  }

  // Handle unknown errors
  sendError(
    res,
    'Internal server error',
    500,
    'INTERNAL_ERROR'
  );
}


