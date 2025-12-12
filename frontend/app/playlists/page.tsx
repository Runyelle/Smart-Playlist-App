"use client"

import { LibrarySidebar } from "@/components/library-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import type { SpotifyPlaylist } from "@/types/spotify"
import { Loader2, Music } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function PlaylistsPage() {
  const router = useRouter()
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const playlistsData = await api.getPlaylists()
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
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Left Sidebar - Library */}
      <LibrarySidebar />

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold mb-2">Your Playlists</h2>
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
                  <Card className="h-full hover:bg-secondary/50 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]">
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
        </div>
      </div>
    </div>
  )
}
