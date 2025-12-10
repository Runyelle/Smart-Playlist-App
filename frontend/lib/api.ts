import type {
  SpotifyUser,
  SpotifyPlaylist,
  PlaylistTracksResponse,
  TransitionRequest,
  TransitionResponse,
} from "@/types/spotify"
import { storage } from "./storage"

/**
 * Get the API base URL, using the current origin if accessed via network IP
 * This handles cases where frontend is accessed via network IP (e.g., 192.168.x.x:3000)
 * but API is on the same machine (just different port)
 */
function getBaseUrl(): string {
  // If explicitly set in env, use that
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL
  }

  // In browser, detect the current origin and use same hostname with API port
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol // 'http:' or 'https:'
    const hostname = window.location.hostname // 'localhost', '127.0.0.1', or network IP
    const apiPort = '4000'
    
    // Use the same protocol and hostname, but with API port
    // This works for localhost, 127.0.0.1, and network IPs
    return `${protocol}//${hostname}:${apiPort}`
  }

  // Fallback for SSR
  return "http://localhost:4000"
}

const BASE_URL = getBaseUrl()

// Debug: Log the BASE_URL being used (only in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('API BASE_URL:', BASE_URL)
  console.log('Current origin:', window.location.origin)
  console.log('NEXT_PUBLIC_API_URL env var:', process.env.NEXT_PUBLIC_API_URL)
}

class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const sessionToken = storage.getSessionToken()
  if (!sessionToken) return null

  try {
    const response = await fetch(`${BASE_URL}/auth/spotify/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionToken }),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    storage.setAccessToken(data.accessToken)
    return data.accessToken
  } catch {
    return null
  }
}

async function fetchWithoutAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMessage = `API error: ${response.statusText}`
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.error?.message || errorMessage
    } catch {
      // If response isn't JSON, use the text or status text
      errorMessage = errorText || errorMessage
    }
    throw new ApiError(errorMessage, response.status)
  }

  const json = await response.json()
  // Backend wraps responses in { success: true, data: ... }
  // Extract the data property if it exists, otherwise return the whole response
  return (json.data !== undefined ? json.data : json) as T
}

async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = storage.getAccessToken()
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const url = `${BASE_URL}${endpoint}`
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('fetchWithAuth:', { url, method: options.method || 'GET', hasToken: !!token })
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    // Try to refresh token on 401 errors
    if (response.status === 401 && token && endpoint !== "/auth/spotify/refresh" && endpoint !== "/auth/logout") {
      const newToken = await refreshAccessToken()
      if (newToken) {
        // Retry the original request with new token
        const retryHeaders: HeadersInit = {
          "Content-Type": "application/json",
          ...options.headers,
          "Authorization": `Bearer ${newToken}`,
        }
        const retryResponse = await fetch(`${BASE_URL}${endpoint}`, {
          ...options,
          headers: retryHeaders,
        })
        if (!retryResponse.ok) {
          const errorText = await retryResponse.text()
          let errorMessage = `API error: ${retryResponse.statusText}`
          try {
            const errorJson = JSON.parse(errorText)
            errorMessage = errorJson.error?.message || errorMessage
          } catch {
            errorMessage = errorText || errorMessage
          }
          throw new ApiError(errorMessage, retryResponse.status)
        }
        const retryJson = await retryResponse.json()
        return (retryJson.data !== undefined ? retryJson.data : retryJson) as T
      } else {
        // Refresh failed, clear auth and throw
        storage.clearAuth()
        throw new ApiError("Session expired. Please log in again.", 401)
      }
    }
    const errorText = await response.text()
    let errorMessage = `API error: ${response.statusText}`
    try {
      const errorJson = JSON.parse(errorText)
      errorMessage = errorJson.error?.message || errorMessage
    } catch {
      errorMessage = errorText || errorMessage
    }
    throw new ApiError(errorMessage, response.status)
  }

  const json = await response.json()
  // Backend wraps responses in { success: true, data: ... }
  // Extract the data property if it exists, otherwise return the whole response
  return (json.data !== undefined ? json.data : json) as T
}

export const api = {
  // Health check
  health: () => fetchWithoutAuth<{ status: string }>("/health"),

  // Auth endpoints (no auth required for login)
  getSpotifyAuthUrl: () =>
    fetchWithoutAuth<{ authUrl: string; state: string; codeVerifier: string; redirectUri: string }>("/auth/spotify/login"),

  exchangeSpotifyCode: (code: string, codeVerifier: string, redirectUri: string) =>
    fetchWithoutAuth<{ accessToken: string; expiresIn: number; sessionToken: string }>("/auth/spotify/callback", {
      method: "POST",
      body: JSON.stringify({
        code,
        codeVerifier,
        redirectUri,
      }),
    }),

  // Spotify endpoints
  getCurrentUser: () => fetchWithAuth<SpotifyUser>("/spotify/me"),

  getPlaylists: () => fetchWithAuth<{ items: SpotifyPlaylist[] }>("/spotify/playlists"),

  getPlaylistTracks: (playlistId: string) =>
    fetchWithAuth<PlaylistTracksResponse>(`/spotify/playlists/${playlistId}/tracks`),

  // Transitions endpoint
  generateTransition: (request: TransitionRequest) =>
    fetchWithAuth<TransitionResponse>("/transitions/generate", {
      method: "POST",
      body: JSON.stringify(request),
    }),

  getTransitionAudioUrl: (transitionId: string) => `${BASE_URL}/transitions/${transitionId}`,

  // Auth endpoints
  refreshToken: (sessionToken: string) =>
    fetchWithAuth<{ accessToken: string; expiresIn: number }>("/auth/spotify/refresh", {
      method: "POST",
      body: JSON.stringify({ sessionToken }),
    }),

  logout: (sessionToken: string) =>
    fetchWithAuth<{ message: string }>("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ sessionToken }),
    }),
}
