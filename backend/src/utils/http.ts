import { Response } from 'express';

/**
 * Standard HTTP response helper functions
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  requestId?: string;
}

/**
 * Send a successful response
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    requestId: res.locals.requestId,
  };
  res.status(statusCode).json(response);
}

/**
 * Send an error response
 */
export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  code?: string
): void {
  const response: ApiResponse = {
    success: false,
    error: {
      message,
      code,
    },
    requestId: res.locals.requestId,
  };
  res.status(statusCode).json(response);
}


