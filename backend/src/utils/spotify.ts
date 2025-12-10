/**
 * Spotify API utility functions
 */

export const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';
export const SPOTIFY_ACCOUNTS_BASE = 'https://accounts.spotify.com';

/**
 * Build Spotify authorization URL
 */
export function buildSpotifyAuthUrl(
  clientId: string,
  redirectUri: string,
  scopes: string,
  codeChallenge: string,
  state?: string
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    ...(state && { state }),
  });

  return `${SPOTIFY_ACCOUNTS_BASE}/authorize?${params.toString()}`;
}

/**
 * Build Spotify token exchange URL
 */
export function buildSpotifyTokenUrl(): string {
  return `${SPOTIFY_ACCOUNTS_BASE}/api/token`;
}


