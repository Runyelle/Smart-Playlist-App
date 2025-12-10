"use client"

import { TrackSettings } from "@/components/track-settings"
import { TransitionsPanel } from "@/components/transitions-panel"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { storage } from "@/lib/storage"
import type { SpotifyTrack } from "@/types/spotify"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function PlaylistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const playlistId = params.id as string

  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const data = await api.getPlaylistTracks(playlistId)
        setTracks(data.items.map((item) => item.track))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch tracks")
        if (err instanceof Error && err.message.includes("401")) {
          router.push("/")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchTracks()
  }, [playlistId, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/playlists")}>Back to Playlists</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/playlists">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Playlists
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const sessionToken = storage.getSessionToken()
                if (sessionToken) {
                  try {
                    await api.logout(sessionToken)
                  } catch (err) {
                    console.error("Logout error:", err)
                  }
                }
                storage.clearAuth()
                router.push("/")
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold mb-6">Playlist Tracks</h2>

        {tracks.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No tracks in this playlist</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6 max-w-6xl">
            {/* Left column: Track list with settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Tracks & Settings</h3>
              {tracks.map((track) => (
                <TrackSettings key={track.id} track={track} />
              ))}
            </div>

            {/* Right column: Transitions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Transitions</h3>
              <TransitionsPanel tracks={tracks} />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
