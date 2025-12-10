import { Router } from 'express';
import {
  getSpotifyLogin,
  postSpotifyCallback,
  postSpotifyRefresh,
  postLogout,
} from '../controllers/auth.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { z } from 'zod';
import { apiLimiter } from '../middlewares/rateLimit.middleware.js';

const router = Router();

// Apply rate limiting to all auth routes
router.use(apiLimiter);

/**
 * GET /auth/spotify/login
 * Get Spotify authorization URL
 */
router.get('/spotify/login', getSpotifyLogin);

/**
 * POST /auth/spotify/callback
 * Exchange authorization code for tokens
 */
router.post(
  '/spotify/callback',
  validateBody(
    z.object({
      code: z.string().min(1),
      codeVerifier: z.string().min(1),
      redirectUri: z.string().url(),
    })
  ),
  postSpotifyCallback
);

/**
 * POST /auth/spotify/refresh
 * Refresh access token
 */
router.post(
  '/spotify/refresh',
  validateBody(
    z.object({
      sessionToken: z.string().min(1),
    })
  ),
  postSpotifyRefresh
);

/**
 * POST /auth/logout
 * Logout and clear session
 */
router.post(
  '/logout',
  validateBody(
    z.object({
      sessionToken: z.string().min(1),
    })
  ),
  postLogout
);

export default router;


