"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { storage } from "@/lib/storage"
import { Music2 } from "lucide-react"
import { useEffect, useState } from "react"

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const existingToken = storage.getAccessToken()
    if (existingToken) {
      window.location.href = "/playlists"
    }
  }, [])

  const handleConnectSpotify = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await api.getSpotifyAuthUrl()
      const { authUrl, codeVerifier, redirectUri } = response
      
      if (!authUrl || !codeVerifier || !redirectUri) {
        throw new Error("Invalid response from server: missing required fields")
      }
      
      storage.setCodeVerifier(codeVerifier)
      // Store the redirect URI so callback can use it
      if (typeof window !== "undefined") {
        sessionStorage.setItem("spotify_redirect_uri", redirectUri)
      }
      window.location.href = authUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to Spotify")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <Card className="w-full max-w-md border-border/50 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <Music2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Smart Playlist</CardTitle>
          <CardDescription className="text-base text-muted-foreground mt-2">
            Generate AI-powered transitions between your favorite tracks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={handleConnectSpotify} disabled={isLoading} className="w-full font-semibold" size="lg">
            {isLoading ? "Connecting..." : "Connect Spotify"}
          </Button>
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </CardContent>
      </Card>
    </div>
  )
}
