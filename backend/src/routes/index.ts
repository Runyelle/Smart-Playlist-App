import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/http.js';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import spotifyRoutes from './spotify.routes.js';
import transitionsRoutes from './transitions.routes.js';

const router = Router();

/**
 * GET /
 * Root endpoint - API information and available routes
 */
router.get('/', (_req: Request, res: Response) => {
  sendSuccess(res, {
    name: 'Smart Playlist API',
    version: '1.0.0',
    description: 'Backend API for Smart Playlist App',
    endpoints: {
      health: {
        method: 'GET',
        path: '/health',
        description: 'Health check endpoint',
      },
      auth: {
        login: {
          method: 'GET',
          path: '/auth/spotify/login',
          description: 'Get Spotify authorization URL for OAuth flow',
        },
        callback: {
          method: 'POST',
          path: '/auth/spotify/callback',
          description: 'Exchange authorization code for tokens',
          body: {
            code: 'string',
            codeVerifier: 'string',
            redirectUri: 'string',
          },
        },
        refresh: {
          method: 'POST',
          path: '/auth/spotify/refresh',
          description: 'Refresh access token',
          body: {
            sessionToken: 'string',
          },
        },
        logout: {
          method: 'POST',
          path: '/auth/logout',
          description: 'Logout and clear session',
          body: {
            sessionToken: 'string',
          },
        },
      },
      spotify: {
        me: {
          method: 'GET',
          path: '/spotify/me',
          description: 'Get current user profile',
          headers: {
            Authorization: 'Bearer <access_token>',
          },
        },
        playlists: {
          method: 'GET',
          path: '/spotify/playlists',
          description: 'Get user playlists',
          headers: {
            Authorization: 'Bearer <access_token>',
          },
          query: {
            limit: 'number (optional, default: 50)',
            offset: 'number (optional, default: 0)',
          },
        },
        playlistTracks: {
          method: 'GET',
          path: '/spotify/playlists/:playlistId/tracks',
          description: 'Get playlist tracks',
          headers: {
            Authorization: 'Bearer <access_token>',
          },
          query: {
            limit: 'number (optional, default: 100)',
            offset: 'number (optional, default: 0)',
          },
        },
      },
      transitions: {
        generate: {
          method: 'POST',
          path: '/transitions/generate',
          description: 'Generate or retrieve cached transition audio',
          body: {
            trackA: {
              id: 'string',
              name: 'string',
              artist: 'string (optional)',
            },
            trackB: {
              id: 'string',
              name: 'string',
              artist: 'string (optional)',
            },
            seconds: 'number (optional, 3-8, default: 5)',
            style: 'string (optional, ambient|lofi|house|cinematic, default: ambient)',
            overrides: {
              tempo: 'number (optional, 0-1)',
              energy: 'number (optional, 0-1)',
              speed: 'number (optional, 0-1)',
            },
          },
        },
        get: {
          method: 'GET',
          path: '/transitions/:transitionId',
          description: 'Serve generated transition audio file',
        },
        status: {
          method: 'GET',
          path: '/transitions/status/:transitionId',
          description: 'Get status of transition generation (PENDING, READY, FAILED)',
        },
      },
    },
    documentation: 'See README.md for detailed API documentation',
  });
});

// Mount route handlers
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/spotify', spotifyRoutes);

// Debug: Log transitions route registration
console.log('🟢 Registering transitions routes at /transitions');
router.use('/transitions', transitionsRoutes);
console.log('🟢 Transitions routes registered successfully');

export default router;


