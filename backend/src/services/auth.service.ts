import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { SpotifyError, AuthenticationError } from '../utils/errors.js';
import { buildSpotifyTokenUrl } from '../utils/spotify.js';
import { sessionStore } from '../models/session.model.js';
import type { SpotifyTokenResponse } from '../types/spotify.types.js';

/**
 * Authentication service for handling Spotify OAuth flow
 */

export interface TokenExchangeParams {
  code: string;
  codeVerifier: string;
  redirectUri: string;
}

export interface TokenPayload {
  accessToken: string;
  expiresIn: number;
  refreshToken?: string;
  scope: string;
}

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function exchangeCodeForTokens(
  params: TokenExchangeParams
): Promise<TokenPayload> {
  const { code, codeVerifier, redirectUri } = params;

  const tokenUrl = buildSpotifyTokenUrl();

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: env.SPOTIFY_CLIENT_ID,
    code_verifier: codeVerifier,
  });

  logger.info({ redirectUri }, 'Exchanging authorization code for tokens');

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error(
        { status: response.status, error: errorData },
        'Token exchange failed'
      );
      throw new SpotifyError(
        `Token exchange failed: ${response.status}`,
        response.status
      );
    }

    const tokenData = (await response.json()) as SpotifyTokenResponse;

    logger.info({ hasRefreshToken: !!tokenData.refresh_token }, 'Tokens obtained successfully');

    return {
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      refreshToken: tokenData.refresh_token,
      scope: tokenData.scope,
    };
  } catch (error) {
    if (error instanceof SpotifyError) {
      throw error;
    }

    logger.error({ error }, 'Unexpected error during token exchange');
    throw new SpotifyError(
      `Token exchange failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<TokenPayload> {
  const tokenUrl = buildSpotifyTokenUrl();

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: env.SPOTIFY_CLIENT_ID,
  });

  logger.info('Refreshing access token');

  try {
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      logger.error(
        { status: response.status, error: errorData },
        'Token refresh failed'
      );
      throw new AuthenticationError('Token refresh failed');
    }

    const tokenData = (await response.json()) as SpotifyTokenResponse;

    logger.info('Access token refreshed successfully');

    return {
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      refreshToken: tokenData.refresh_token || refreshToken, // Spotify may return new refresh token
      scope: tokenData.scope,
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }

    logger.error({ error }, 'Unexpected error during token refresh');
    throw new AuthenticationError('Token refresh failed');
  }
}

/**
 * Create a signed session token (JWT)
 */
export function createSessionToken(sessionId: string): string {
  return jwt.sign({ sessionId }, env.JWT_SECRET, {
    expiresIn: '30d', // Session expires in 30 days
  });
}

/**
 * Verify and decode session token
 */
export function verifySessionToken(token: string): { sessionId: string } {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { sessionId: string };
    return decoded;
  } catch (error) {
    throw new AuthenticationError('Invalid session token');
  }
}

/**
 * Store refresh token in session store
 */
export async function storeRefreshToken(sessionId: string, refreshToken: string): Promise<void> {
  await sessionStore.set(sessionId, {
    refreshToken,
    expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
  });
  logger.debug({ sessionId }, 'Refresh token stored');
}

/**
 * Get refresh token from session store
 */
export async function getRefreshToken(sessionId: string): Promise<string | undefined> {
  const session = await sessionStore.get(sessionId);
  return session?.refreshToken;
}

/**
 * Delete session from session store
 */
export async function deleteSession(sessionId: string): Promise<void> {
  await sessionStore.delete(sessionId);
  logger.debug({ sessionId }, 'Session deleted');
}


