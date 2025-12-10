import { Router } from 'express';
import {
  getMe,
  getPlaylists,
  getPlaylistTracksHandler,
} from '../controllers/spotify.controller.js';
import { apiLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

// Apply rate limiting to all Spotify routes
router.use(apiLimiter);

/**
 * GET /spotify/me
 * Get current user's profile
 */
router.get('/me', getMe);

/**
 * GET /spotify/playlists
 * Get user's playlists
 */
router.get('/playlists', getPlaylists);

/**
 * GET /spotify/playlists/:playlistId/tracks
 * Get playlist tracks
 */
router.get('/playlists/:playlistId/tracks', getPlaylistTracksHandler);

export default router;


