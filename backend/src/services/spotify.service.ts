import fetch from 'node-fetch';
import { logger } from '../utils/logger.js';
import { SpotifyError, AuthenticationError } from '../utils/errors.js';
import { SPOTIFY_API_BASE } from '../utils/spotify.js';
import type {
  SpotifyUser,
  SpotifyPlaylistsResponse,
  SpotifyPlaylistTracksResponse,
  SpotifyErrorResponse,
} from '../types/spotify.types.js';

/**
 * Spotify Web API service
 * Handles all API calls to Spotify
 */

/**
 * Make authenticated request to Spotify API
 */
async function spotifyRequest<T>(
  endpoint: string,
  accessToken: string
): Promise<T> {
  const url = `${SPOTIFY_API_BASE}${endpoint}`;

  logger.debug({ endpoint }, 'Making Spotify API request');

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({
        error: { status: response.status, message: 'Unknown error' },
      }))) as SpotifyErrorResponse;

      logger.error(
        { status: response.status, error: errorData },
        'Spotify API request failed'
      );

      if (response.status === 401) {
        throw new AuthenticationError('Invalid or expired access token');
      }

      throw new SpotifyError(
        errorData.error?.message || 'Spotify API error',
        response.status
      );
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof SpotifyError || error instanceof AuthenticationError) {
      throw error;
    }

    logger.error({ error, endpoint }, 'Unexpected error during Spotify API request');
    throw new SpotifyError(
      `Spotify API request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      500
    );
  }
}

/**
 * Get current user's profile
 */
export async function getCurrentUser(accessToken: string): Promise<SpotifyUser> {
  return spotifyRequest<SpotifyUser>('/me', accessToken);
}

/**
 * Get user's playlists
 */
export async function getUserPlaylists(
  accessToken: string,
  limit = 50,
  offset = 0
): Promise<SpotifyPlaylistsResponse> {
  const endpoint = `/me/playlists?limit=${limit}&offset=${offset}`;
  return spotifyRequest<SpotifyPlaylistsResponse>(endpoint, accessToken);
}

/**
 * Get playlist tracks
 */
export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string,
  limit = 100,
  offset = 0
): Promise<SpotifyPlaylistTracksResponse> {
  const endpoint = `/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`;
  return spotifyRequest<SpotifyPlaylistTracksResponse>(endpoint, accessToken);
}


