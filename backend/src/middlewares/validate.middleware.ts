import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/http.js';

/**
 * Validation middleware factory
 * Validates request body, query, or params against a zod schema
 */

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        sendError(res, `Validation error: ${message}`, 400, 'VALIDATION_ERROR');
      } else {
        sendError(res, 'Validation error', 400, 'VALIDATION_ERROR');
      }
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        sendError(res, `Validation error: ${message}`, 400, 'VALIDATION_ERROR');
      } else {
        sendError(res, 'Validation error', 400, 'VALIDATION_ERROR');
      }
    }
  };
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        sendError(res, `Validation error: ${message}`, 400, 'VALIDATION_ERROR');
      } else {
        sendError(res, 'Validation error', 400, 'VALIDATION_ERROR');
      }
    }
  };
}


