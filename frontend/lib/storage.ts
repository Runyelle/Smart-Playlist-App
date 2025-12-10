import type { TrackSettings } from "@/types/spotify"

const TRACK_SETTINGS_KEY = "trackSettingsMap"
const CODE_VERIFIER_KEY = "codeVerifier"
const ACCESS_TOKEN_KEY = "access_token"
const SESSION_TOKEN_KEY = "session_token"

export const storage = {
  // Track settings (localStorage)
  getTrackSettings: (trackId: string): TrackSettings | null => {
    try {
      const stored = localStorage.getItem(TRACK_SETTINGS_KEY)
      if (!stored) return null
      const map = JSON.parse(stored) as Record<string, TrackSettings>
      return map[trackId] || null
    } catch {
      return null
    }
  },

  setTrackSettings: (trackId: string, settings: TrackSettings) => {
    try {
      const stored = localStorage.getItem(TRACK_SETTINGS_KEY)
      const map = stored ? (JSON.parse(stored) as Record<string, TrackSettings>) : {}
      map[trackId] = settings
      localStorage.setItem(TRACK_SETTINGS_KEY, JSON.stringify(map))
    } catch (error) {
      console.error("[v0] Failed to save track settings:", error)
    }
  },

  // Auth data
  // Note: Using localStorage instead of sessionStorage for code verifier
  // because it needs to persist across redirects, especially when redirecting
  // from localhost to 127.0.0.1 or vice versa (browsers treat them as different origins)
  getCodeVerifier: (): string | null => {
    try {
      return localStorage.getItem(CODE_VERIFIER_KEY)
    } catch {
      return null
    }
  },

  setCodeVerifier: (verifier: string) => {
    try {
      localStorage.setItem(CODE_VERIFIER_KEY, verifier)
    } catch (error) {
      console.error("[v0] Failed to persist code verifier:", error)
    }
  },

  getAccessToken: (): string | null => {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY)
    } catch {
      return null
    }
  },

  setAccessToken: (token: string) => {
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token)
    } catch (error) {
      console.error("[v0] Failed to persist access token:", error)
    }
  },

  getSessionToken: (): string | null => {
    try {
      return localStorage.getItem(SESSION_TOKEN_KEY)
    } catch {
      return null
    }
  },

  setSessionToken: (token: string) => {
    try {
      localStorage.setItem(SESSION_TOKEN_KEY, token)
    } catch (error) {
      console.error("[v0] Failed to persist session token:", error)
    }
  },

  clearAuth: () => {
    try {
      localStorage.removeItem(CODE_VERIFIER_KEY)
      sessionStorage.removeItem("spotify_redirect_uri")
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(SESSION_TOKEN_KEY)
    } catch (error) {
      console.error("[v0] Failed to clear auth state:", error)
    }
  },
}
