"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { storage } from "@/lib/storage"
import type { SpotifyTrack, TrackSettings as TrackSettingsType } from "@/types/spotify"
import { useEffect, useState } from "react"

interface TrackSettingsProps {
  track: SpotifyTrack
}

export function TrackSettings({ track }: TrackSettingsProps) {
  const [settings, setSettings] = useState<TrackSettingsType>({
    tempo: 0.5,
    energy: 0.5,
    speed: 0.5,
  })

  useEffect(() => {
    const saved = storage.getTrackSettings(track.id)
    if (saved) {
      setSettings(saved)
    }
  }, [track.id])

  const updateSetting = <K extends keyof TrackSettingsType>(key: K, value: TrackSettingsType[K]) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    storage.setTrackSettings(track.id, newSettings)
  }

  const artistNames = track.artists.map((a) => a.name).join(", ")
  const durationMin = Math.floor(track.duration_ms / 60000)
  const durationSec = Math.floor((track.duration_ms % 60000) / 1000)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          {track.album?.images?.[0] && (
            <img
              src={track.album.images[0].url || "/placeholder.svg"}
              alt={track.name}
              className="h-16 w-16 rounded object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base line-clamp-1">{track.name}</CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-1">{artistNames}</p>
            <p className="text-xs text-muted-foreground">
              {durationMin}:{durationSec.toString().padStart(2, "0")}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`tempo-${track.id}`} className="text-sm">
            Tempo blend: {(settings.tempo ?? 0.5).toFixed(2)}
          </Label>
          <Slider
            id={`tempo-${track.id}`}
            min={0}
            max={1}
            step={0.01}
            value={[settings.tempo ?? 0.5]}
            onValueChange={([value]) => updateSetting("tempo", value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`energy-${track.id}`} className="text-sm">
            Energy: {(settings.energy ?? 0.5).toFixed(2)}
          </Label>
          <Slider
            id={`energy-${track.id}`}
            min={0}
            max={1}
            step={0.01}
            value={[settings.energy ?? 0.5]}
            onValueChange={([value]) => updateSetting("energy", value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`speed-${track.id}`} className="text-sm">
            Speed: {(settings.speed ?? 0.5).toFixed(2)}
          </Label>
          <Slider
            id={`speed-${track.id}`}
            min={0}
            max={1}
            step={0.01}
            value={[settings.speed ?? 0.5]}
            onValueChange={([value]) => updateSetting("speed", value)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
