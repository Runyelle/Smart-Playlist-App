import { Request, Response, NextFunction } from 'express';
import { generateRandomString } from '../utils/crypto.js';

/**
 * Request ID middleware
 * Adds a unique request ID to each request for tracing
 */

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Generate or use existing request ID
  const requestId = (req.headers['x-request-id'] as string) || generateRandomString(16);
  
  // Store in request locals for use in controllers
  res.locals.requestId = requestId;
  
  // Add to response headers
  res.setHeader('X-Request-ID', requestId);
  
  next();
}


