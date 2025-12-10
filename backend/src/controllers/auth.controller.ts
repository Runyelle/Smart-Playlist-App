import { Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger.js';
import { sendSuccess, sendError } from '../utils/http.js';
import {
  exchangeCodeForTokens,
  refreshAccessToken,
  createSessionToken,
  storeRefreshToken,
  getRefreshToken,
  verifySessionToken,
  deleteSession,
} from '../services/auth.service.js';
import { generateRandomString, generateCodeVerifier, generateCodeChallenge } from '../utils/crypto.js';
import { buildSpotifyAuthUrl } from '../utils/spotify.js';
import { env } from '../config/env.js';

/**
 * Authentication controller
 * Handles Spotify OAuth flow
 */

// Validation schemas
const callbackSchema = z.object({
  code: z.string().min(1),
  codeVerifier: z.string().min(1),
  redirectUri: z.string().url(),
});

const refreshSchema = z.object({
  sessionToken: z.string().min(1),
});

/**
 * GET /auth/spotify/login
 * Returns Spotify authorization URL and state for PKCE flow
 */
export async function getSpotifyLogin(_req: Request, res: Response): Promise<void> {
  try {
    const state = generateRandomString(16);
    const codeVerifier = generateCodeVerifier(); // PKCE code verifier (43-128 chars, URL-safe)
    
    // Store code verifier in session (in production, use secure session store)
    // For MVP, we'll return it to frontend to send back in callback
    // In production, store in secure httpOnly cookie
    
    const codeChallenge = generateCodeChallenge(codeVerifier);
    
    const authUrl = buildSpotifyAuthUrl(
      env.SPOTIFY_CLIENT_ID,
      env.SPOTIFY_REDIRECT_URI,
      env.SPOTIFY_SCOPES,
      codeChallenge,
      state
    );

    sendSuccess(res, {
      authUrl,
      state,
      codeVerifier, // Frontend should store this securely
      redirectUri: env.SPOTIFY_REDIRECT_URI, // Return the redirect URI so frontend can use it
    });
  } catch (error) {
    logger.error({ error }, 'Failed to generate Spotify login URL');
    sendError(res, 'Failed to generate login URL', 500);
  }
}

/**
 * POST /auth/spotify/callback
 * Exchange authorization code for tokens
 */
export async function postSpotifyCallback(req: Request, res: Response): Promise<void> {
  try {
    const { code, codeVerifier, redirectUri } = callbackSchema.parse(req.body);

    // Exchange code for tokens
    const tokenPayload = await exchangeCodeForTokens({
      code,
      codeVerifier,
      redirectUri,
    });

    // Create session
    const sessionId = generateRandomString(32);
    
    // Store refresh token
    if (tokenPayload.refreshToken) {
      await storeRefreshToken(sessionId, tokenPayload.refreshToken);
    }

    // Create session token (JWT)
    const sessionToken = createSessionToken(sessionId);

    sendSuccess(res, {
      accessToken: tokenPayload.accessToken,
      expiresIn: tokenPayload.expiresIn,
      sessionToken,
      scope: tokenPayload.scope,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to handle Spotify callback');
    if (error instanceof z.ZodError) {
      sendError(res, 'Invalid request data', 400, 'VALIDATION_ERROR');
    } else {
      sendError(res, 'Failed to complete authentication', 500);
    }
  }
}

/**
 * POST /auth/spotify/refresh
 * Refresh access token using refresh token from session
 */
export async function postSpotifyRefresh(req: Request, res: Response): Promise<void> {
  try {
    const { sessionToken } = refreshSchema.parse(req.body);

    // Verify session token
    const { sessionId } = verifySessionToken(sessionToken);

    // Get refresh token from session store
    const refreshToken = await getRefreshToken(sessionId);
    if (!refreshToken) {
      sendError(res, 'Session not found or expired', 401, 'SESSION_EXPIRED');
      return;
    }

    // Refresh access token
    const tokenPayload = await refreshAccessToken(refreshToken);

    // Update stored refresh token if new one provided
    if (tokenPayload.refreshToken && tokenPayload.refreshToken !== refreshToken) {
      await storeRefreshToken(sessionId, tokenPayload.refreshToken);
    }

    sendSuccess(res, {
      accessToken: tokenPayload.accessToken,
      expiresIn: tokenPayload.expiresIn,
      scope: tokenPayload.scope,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to refresh token');
    if (error instanceof z.ZodError) {
      sendError(res, 'Invalid request data', 400, 'VALIDATION_ERROR');
    } else {
      sendError(res, 'Failed to refresh token', 500);
    }
  }
}

/**
 * POST /auth/logout
 * Clear session and refresh token
 */
export async function postLogout(req: Request, res: Response): Promise<void> {
  try {
    const { sessionToken } = refreshSchema.parse(req.body);

    // Verify session token
    const { sessionId } = verifySessionToken(sessionToken);

    // Delete session from store
    await deleteSession(sessionId);

    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error) {
    logger.error({ error }, 'Failed to logout');
    if (error instanceof z.ZodError) {
      sendError(res, 'Invalid request data', 400, 'VALIDATION_ERROR');
    } else {
      sendError(res, 'Failed to logout', 500);
    }
  }
}

