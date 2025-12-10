import { Router } from 'express';
import {
  postGenerateTransition,
  getTransition,
} from '../controllers/transitions.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { transitionLimiter, apiLimiter } from '../middlewares/rateLimit.middleware.js';
import { z } from 'zod';

const router = Router();

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log('Transitions router - Request received:', {
    method: req.method,
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl,
    baseUrl: req.baseUrl,
  });
  next();
});

// Validation schema
const transitionRequestSchema = z.object({
  trackA: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    artist: z.string().optional(),
  }),
  trackB: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    artist: z.string().optional(),
  }),
  seconds: z.number().int().min(3).max(8).optional(),
  style: z.enum(['ambient', 'lofi', 'house', 'cinematic']).optional(),
  overrides: z
    .object({
      tempo: z.number().min(0).max(1).optional(),
      energy: z.number().min(0).max(1).optional(),
      speed: z.number().min(0).max(1).optional(),
    })
    .optional(),
});

/**
 * POST /transitions/generate
 * Generate or retrieve cached transition
 * Uses strict rate limiting (expensive operation)
 * IMPORTANT: This must be defined BEFORE the GET /:transitionId route
 */
router.post(
  '/generate',
  (req, res, next) => {
    console.log('POST /transitions/generate route hit', {
      method: req.method,
      path: req.path,
      url: req.url,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
    });
    next();
  },
  transitionLimiter,
  validateBody(transitionRequestSchema),
  postGenerateTransition
);

/**
 * GET /transitions/:transitionId
 * Serve generated transition audio file
 * Uses general rate limiting
 * IMPORTANT: This must be defined AFTER the POST /generate route
 */
router.get('/:transitionId', apiLimiter, getTransition);

export default router;


