import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

/**
 * Rate limiting middleware
 * Prevents abuse by limiting requests per IP
 */

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({ ip: req.ip, path: req.path }, 'Rate limit exceeded');
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      requestId: res.locals.requestId,
    });
  },
});

/**
 * Strict rate limiter for transition generation
 * 10 requests per hour (expensive operation)
 */
export const transitionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many transition generation requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({ ip: req.ip }, 'Transition generation rate limit exceeded');
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many transition generation requests, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      requestId: res.locals.requestId,
    });
  },
});


