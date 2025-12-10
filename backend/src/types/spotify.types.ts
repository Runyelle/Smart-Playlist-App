/**
 * TypeScript types for Spotify Web API responses
 */

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email?: string;
  images?: Array<{ url: string; height?: number; width?: number }>;
  country?: string;
  product?: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  owner: {
    id: string;
    display_name?: string;
  };
  images?: Array<{ url: string; height?: number; width?: number }>;
  tracks: {
    href: string;
    total: number;
  };
  public: boolean;
  collaborative: boolean;
}

export interface SpotifyPlaylistsResponse {
  items: SpotifyPlaylist[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  album: {
    id: string;
    name: string;
    images?: Array<{ url: string; height?: number; width?: number }>;
  };
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifyPlaylistTrack {
  added_at: string;
  track: SpotifyTrack | null;
}

export interface SpotifyPlaylistTracksResponse {
  items: SpotifyPlaylistTrack[];
  total: number;
  limit: number;
  offset: number;
  next: string | null;
  previous: string | null;
}

export interface SpotifyErrorResponse {
  error: {
    status: number;
    message: string;
  };
}


