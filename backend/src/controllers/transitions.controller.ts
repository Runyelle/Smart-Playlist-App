import { Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { sendSuccess, sendError } from '../utils/http.js';
import { NotFoundError, MusicGenError } from '../utils/errors.js';
import { generateOrGetTransition } from '../services/transitions.service.js';
import { readAudioFile } from '../utils/file.js';
import type { TransitionRequest } from '../models/transition.model.js';

/**
 * Transitions controller
 * Handles transition generation and serving
 */

// Validation schema for transition generation
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
}) satisfies z.ZodType<TransitionRequest>;

/**
 * POST /transitions/generate
 * Generate or retrieve cached transition
 */
export async function postGenerateTransition(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const request = transitionRequestSchema.parse(req.body);
    
    logger.info(
      {
        trackA: request.trackA.id,
        trackB: request.trackB.id,
        seconds: request.seconds,
        style: request.style,
      },
      'Generating transition'
    );

    const result = await generateOrGetTransition(request);
    sendSuccess(res, result);
  } catch (error) {
    // Log detailed error to server console
    logger.error({ error }, 'Failed to generate transition');
    console.error('Transition generation error:', error);
    
    if (error instanceof z.ZodError) {
      const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      console.error('Validation error details:', message);
      sendError(res, 'Invalid request data', 400, 'VALIDATION_ERROR');
    } else if (error instanceof MusicGenError) {
      // Log detailed MusicGen error to console
      console.error('MusicGen error details:', {
        message: error.message,
        statusCode: error.statusCode,
        code: error.code,
      });
      // Return generic message to frontend
      sendError(res, 'Failed to generate transition. Please try again later.', error.statusCode || 500, error.code || 'MUSICGEN_ERROR');
    } else if (error instanceof Error) {
      // Log detailed error to console
      console.error('Error details:', error.message, error.stack);
      sendError(res, 'Failed to generate transition. Please try again later.', 500);
    } else {
      console.error('Unknown error:', error);
      sendError(res, 'Failed to generate transition. Please try again later.', 500);
    }
  }
}

/**
 * GET /transitions/:transitionId
 * Serve generated transition audio file
 */
export async function getTransition(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { transitionId } = req.params;

    if (!transitionId) {
      sendError(res, 'Transition ID is required', 400, 'VALIDATION_ERROR');
      return;
    }

    const filename = `${transitionId}.wav`;

    try {
      const audioBuffer = await readAudioFile(filename);

      // Set appropriate headers for audio file
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', audioBuffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

      res.send(audioBuffer);
    } catch (error) {
      throw new NotFoundError(`Transition ${transitionId} not found`);
    }
  } catch (error) {
    logger.error({ error, transitionId: req.params.transitionId }, 'Failed to serve transition');
    if (error instanceof NotFoundError) {
      sendError(res, error.message, error.statusCode, error.code);
    } else {
      sendError(res, 'Failed to serve transition', 500);
    }
  }
}


