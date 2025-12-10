"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { storage } from "@/lib/storage"
import type { SpotifyTrack, TransitionResponse } from "@/types/spotify"
import { Loader2 } from "lucide-react"
import { useState } from "react"

interface TransitionsPanelProps {
  tracks: SpotifyTrack[]
}

interface TransitionState {
  response?: TransitionResponse
  isLoading: boolean
  error?: string
}

export function TransitionsPanel({ tracks }: TransitionsPanelProps) {
  const [transitions, setTransitions] = useState<Map<string, TransitionState>>(new Map())
  const [seconds, setSeconds] = useState(5)
  const [style, setStyle] = useState("ambient")

  const generateTransition = async (trackA: SpotifyTrack, trackB: SpotifyTrack) => {
    const key = `${trackA.id}-${trackB.id}`
    setTransitions(new Map(transitions.set(key, { isLoading: true })))

    try {
      const settingsA = storage.getTrackSettings(trackA.id) || { tempo: 0.5, energy: 0.5, speed: 0.5 }
      const settingsB = storage.getTrackSettings(trackB.id) || { tempo: 0.5, energy: 0.5, speed: 0.5 }

      // Average the settings from both tracks for the transition
      const overrides = {
        tempo: ((settingsA.tempo ?? 0.5) + (settingsB.tempo ?? 0.5)) / 2,
        energy: ((settingsA.energy ?? 0.5) + (settingsB.energy ?? 0.5)) / 2,
        speed: ((settingsA.speed ?? 0.5) + (settingsB.speed ?? 0.5)) / 2,
      }

      const response = await api.generateTransition({
        trackA: {
          id: trackA.id,
          name: trackA.name,
          artist: trackA.artists.map((a) => a.name).join(", "),
        },
        trackB: {
          id: trackB.id,
          name: trackB.name,
          artist: trackB.artists.map((a) => a.name).join(", "),
        },
        overrides,
        seconds,
        style: style as "ambient" | "lofi" | "house" | "cinematic",
      })

      setTransitions(new Map(transitions.set(key, { response, isLoading: false })))
    } catch (err) {
      // Log detailed error to console for debugging
      console.error("Failed to generate transition:", err)
      // Show generic user-friendly message
      setTransitions(
        new Map(
          transitions.set(key, {
            isLoading: false,
            error: "Failed to generate transition. Please try again later.",
          }),
        ),
      )
    }
  }

  if (tracks.length < 2) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Need at least 2 tracks to generate transitions</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transition Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="seconds">Duration (seconds)</Label>
            <Input
              id="seconds"
              type="number"
              value={seconds}
              onChange={(e) => setSeconds(Number(e.target.value))}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="style">Style</Label>
            <select
              id="style"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="ambient">Ambient</option>
              <option value="lofi">Lo-Fi</option>
              <option value="house">House</option>
              <option value="cinematic">Cinematic</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {tracks.slice(0, -1).map((trackA, index) => {
        const trackB = tracks[index + 1]
        const key = `${trackA.id}-${trackB.id}`
        const state = transitions.get(key)

        return (
          <Card key={key}>
            <CardHeader>
              <CardTitle className="text-sm">Transition {index + 1}</CardTitle>
              <CardDescription className="text-xs">
                {trackA.name} → {trackB.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => generateTransition(trackA, trackB)}
                disabled={state?.isLoading}
                className="w-full"
                size="sm"
              >
                {state?.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Transition
              </Button>

              {state?.error && <p className="text-xs text-destructive">{state.error}</p>}

              {state?.response && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {state.response.cached ? "(Cached)" : "(Newly generated)"}
                  </p>
                  <audio controls className="w-full" src={api.getTransitionAudioUrl(state.response.transitionId)} />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
