import { Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { sendSuccess, sendError } from '../utils/http.js';
import { AuthenticationError } from '../utils/errors.js';
import {
  getCurrentUser,
  getUserPlaylists,
  getPlaylistTracks,
} from '../services/spotify.service.js';

/**
 * Spotify controller
 * Handles Spotify Web API requests
 */

// Validation schemas
const playlistsQuerySchema = z.object({
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(50)).optional(),
  offset: z.string().transform(Number).pipe(z.number().int().nonnegative()).optional(),
});

const playlistTracksQuerySchema = z.object({
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().int().nonnegative()).optional(),
});

/**
 * Extract access token from request
 * Can come from Authorization header or body
 */
function getAccessToken(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  if (req.body?.accessToken) {
    return req.body.accessToken;
  }

  throw new AuthenticationError('Access token required');
}

/**
 * GET /spotify/me
 * Get current user's profile
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const accessToken = getAccessToken(req);
    const user = await getCurrentUser(accessToken);
    sendSuccess(res, user);
  } catch (error) {
    logger.error({ error }, 'Failed to get user profile');
    if (error instanceof AuthenticationError) {
      sendError(res, error.message, error.statusCode, error.code);
    } else {
      sendError(res, 'Failed to get user profile', 500);
    }
  }
}

/**
 * GET /spotify/playlists
 * Get user's playlists
 */
export async function getPlaylists(req: Request, res: Response): Promise<void> {
  try {
    const accessToken = getAccessToken(req);
    const { limit = 50, offset = 0 } = playlistsQuerySchema.parse(req.query);
    
    const playlists = await getUserPlaylists(accessToken, limit, offset);
    sendSuccess(res, playlists);
  } catch (error) {
    logger.error({ error }, 'Failed to get playlists');
    if (error instanceof AuthenticationError) {
      sendError(res, error.message, error.statusCode, error.code);
    } else if (error instanceof z.ZodError) {
      sendError(res, 'Invalid query parameters', 400, 'VALIDATION_ERROR');
    } else {
      sendError(res, 'Failed to get playlists', 500);
    }
  }
}

/**
 * GET /spotify/playlists/:playlistId/tracks
 * Get playlist tracks
 */
export async function getPlaylistTracksHandler(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const accessToken = getAccessToken(req);
    const { playlistId } = req.params;
    const { limit = 100, offset = 0 } = playlistTracksQuerySchema.parse(req.query);

    if (!playlistId) {
      sendError(res, 'Playlist ID is required', 400, 'VALIDATION_ERROR');
      return;
    }

    const tracks = await getPlaylistTracks(accessToken, playlistId, limit, offset);
    sendSuccess(res, tracks);
  } catch (error) {
    logger.error({ error, playlistId: req.params.playlistId }, 'Failed to get playlist tracks');
    if (error instanceof AuthenticationError) {
      sendError(res, error.message, error.statusCode, error.code);
    } else if (error instanceof z.ZodError) {
      sendError(res, 'Invalid query parameters', 400, 'VALIDATION_ERROR');
    } else {
      sendError(res, 'Failed to get playlist tracks', 500);
    }
  }
}


