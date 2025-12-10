export interface SpotifyUser {
  id: string
  display_name: string
  email?: string
  images?: Array<{ url: string }>
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description?: string
  images?: Array<{ url: string }>
  tracks: {
    total: number
  }
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: Array<{ name: string }>
  duration_ms: number
  album?: {
    images?: Array<{ url: string }>
  }
}

export interface PlaylistTracksResponse {
  items: Array<{
    track: SpotifyTrack
  }>
}

export interface TrackSettings {
  tempo?: number
  energy?: number
  speed?: number
}

export interface TransitionRequest {
  trackA: {
    id: string
    name: string
    artist?: string
  }
  trackB: {
    id: string
    name: string
    artist?: string
  }
  overrides?: {
    tempo?: number
    energy?: number
    speed?: number
  }
  seconds?: number
  style?: "ambient" | "lofi" | "house" | "cinematic"
}

export interface TransitionResponse {
  transitionId: string
  url: string
  cached: boolean
}
