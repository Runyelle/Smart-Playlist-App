"use client"

import { LibrarySidebar } from "@/components/library-sidebar"
import { TrackSettings } from "@/components/track-settings"
import { TransitionsPanel } from "@/components/transitions-panel"
import { Card, CardContent } from "@/components/ui/card"
import { api } from "@/lib/api"
import type { SpotifyPlaylist, SpotifyTrack } from "@/types/spotify"
import { Loader2, Music } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function PlaylistDetailPage() {
  const params = useParams()
  const router = useRouter()
  const playlistId = params.id as string

  const [playlist, setPlaylist] = useState<SpotifyPlaylist | null>(null)
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch playlists to get playlist details
        const playlistsData = await api.getPlaylists()
        const foundPlaylist = playlistsData.items.find((p) => p.id === playlistId)
        
        if (!foundPlaylist) {
          setError("Playlist not found")
          setIsLoading(false)
          return
        }

        setPlaylist(foundPlaylist)

        // Fetch tracks
        const tracksData = await api.getPlaylistTracks(playlistId)
        setTracks(tracksData.items.map((item) => item.track))
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data")
        if (err instanceof Error && err.message.includes("401")) {
          router.push("/")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [playlistId, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !playlist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">{error || "Playlist not found"}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Calculate total duration
  const totalDurationMs = tracks.reduce((sum, track) => sum + track.duration_ms, 0)
  const totalHours = Math.floor(totalDurationMs / 3600000)
  const totalMinutes = Math.floor((totalDurationMs % 3600000) / 60000)

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Left Sidebar - Library */}
      <LibrarySidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Playlist Header */}
        <div className="bg-gradient-to-b from-muted/20 to-background px-8 pt-16 pb-8">
          <div className="flex items-end gap-6">
            {playlist.images?.[0] ? (
              <img
                src={playlist.images[0].url}
                alt={playlist.name}
                className="h-64 w-64 rounded-md shadow-2xl object-cover"
              />
            ) : (
              <div className="h-64 w-64 rounded-md bg-secondary flex items-center justify-center shadow-2xl">
                <Music className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0 pb-2">
              <div className="text-sm font-medium mb-2">Playlist</div>
              <h1 className="text-6xl font-bold mb-4 truncate">{playlist.name}</h1>
              {playlist.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                  {playlist.description}
                </p>
              )}
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{playlist.tracks.total}</span> songs
                {totalHours > 0 && (
                  <>
                    , <span className="font-medium">{totalHours} hr</span>
                  </>
                )}
                {totalMinutes > 0 && (
                  <>
                    {" "}
                    <span className="font-medium">{totalMinutes} min</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Tracks List */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {tracks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No tracks in this playlist</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tracks.map((track) => (
                <TrackSettings key={track.id} track={track} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Transitions */}
      <div className="w-96 border-l border-border bg-background overflow-y-auto">
        <div className="p-6 sticky top-0 bg-background border-b border-border z-10">
          <h2 className="text-xl font-bold">Transitions</h2>
        </div>
        <div className="p-6">
          <TransitionsPanel tracks={tracks} />
        </div>
      </div>
    </div>
  )
}
