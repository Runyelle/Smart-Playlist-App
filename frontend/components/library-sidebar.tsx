"use client"

import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { storage } from "@/lib/storage"
import type { SpotifyPlaylist, SpotifyUser } from "@/types/spotify"
import { Home, Library, LogOut, Music } from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export function LibrarySidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, playlistsData] = await Promise.all([
          api.getCurrentUser(),
          api.getPlaylists(),
        ])
        setUser(userData)
        setPlaylists(playlistsData.items)
      } catch (err) {
        console.error("Failed to fetch library data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleLogout = async () => {
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
  }

  return (
    <div className="h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/playlists">
          <h1 className="text-2xl font-bold text-foreground mb-6">Smart Playlist</h1>
        </Link>
        <Link href="/playlists">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 hover:bg-sidebar-accent"
          >
            <Home className="h-5 w-5" />
            Home
          </Button>
        </Link>
      </div>

      {/* Library Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Library className="h-5 w-5 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">Your Library</h2>
            </div>
          </div>

          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading playlists...</div>
          ) : playlists.length === 0 ? (
            <div className="text-sm text-muted-foreground">No playlists found</div>
          ) : (
            <div className="space-y-1">
              {playlists.map((playlist) => {
                const isActive = pathname === `/playlist/${playlist.id}`
                return (
                  <Link key={playlist.id} href={`/playlist/${playlist.id}`}>
                    <div
                      className={`
                        flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors
                        ${isActive
                          ? "bg-sidebar-accent text-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                        }
                      `}
                    >
                      {playlist.images?.[0] ? (
                        <img
                          src={playlist.images[0].url}
                          alt={playlist.name}
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-secondary flex items-center justify-center">
                          <Music className="h-6 w-6" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{playlist.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {playlist.tracks.total} tracks
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer with User Info */}
      <div className="p-4 border-t border-sidebar-border">
        {user && (
          <div className="flex items-center gap-3 mb-3">
            {user.images?.[0] ? (
              <img
                src={user.images[0].url}
                alt={user.display_name}
                className="h-8 w-8 rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                {user.display_name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.display_name}</div>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="w-full justify-start gap-2 hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}

