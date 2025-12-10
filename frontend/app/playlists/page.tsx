"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { storage } from "@/lib/storage"
import type { SpotifyPlaylist, SpotifyUser } from "@/types/spotify"
import { Loader2, Music } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function PlaylistsPage() {
  const router = useRouter()
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, playlistsData] = await Promise.all([api.getCurrentUser(), api.getPlaylists()])
        setUser(userData)
        setPlaylists(playlistsData.items)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data")
        // Redirect to login if unauthorized
        if (err instanceof Error && err.message.includes("401")) {
          router.push("/")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

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
            <Button onClick={() => router.push("/")}>Back to Home</Button>
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
            <h1 className="text-2xl font-semibold">Smart Playlist</h1>
            <div className="flex items-center gap-4">
              {user && <div className="text-sm text-muted-foreground">{user.display_name}</div>}
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
        </div>
      </header>

      <main className="container py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Your Playlists</h2>
          <p className="text-muted-foreground">Select a playlist to generate transitions</p>
        </div>

        {playlists.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <Music className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No playlists found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {playlists.map((playlist) => (
              <Link key={playlist.id} href={`/playlist/${playlist.id}`}>
                <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardHeader>
                    {playlist.images?.[0] && (
                      <img
                        src={playlist.images[0].url || "/placeholder.svg"}
                        alt={playlist.name}
                        className="w-full aspect-square object-cover rounded-md mb-4"
                      />
                    )}
                    <CardTitle className="text-lg">{playlist.name}</CardTitle>
                    {playlist.description && (
                      <CardDescription className="line-clamp-2">{playlist.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{playlist.tracks.total} tracks</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
