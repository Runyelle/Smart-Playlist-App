"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { storage } from "@/lib/storage"
import { Loader2, Music2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get("code")
    const codeVerifier = storage.getCodeVerifier()
    // Get the redirect URI that was used when initiating the auth flow
    const redirectUri = typeof window !== "undefined" ? sessionStorage.getItem("spotify_redirect_uri") : null

    if (!code) {
      setError("No authorization code received")
      return
    }

    if (!codeVerifier) {
      setError("Missing code verifier")
      return
    }

    if (!redirectUri) {
      setError("Missing redirect URI")
      return
    }

    const exchangeCode = async () => {
      try {
        const { accessToken, sessionToken } = await api.exchangeSpotifyCode(code, codeVerifier, redirectUri)
        storage.setAccessToken(accessToken)
        storage.setSessionToken(sessionToken)
        // Clean up stored code verifier and redirect URI after successful exchange
        if (typeof window !== "undefined") {
          localStorage.removeItem("codeVerifier")
          sessionStorage.removeItem("spotify_redirect_uri")
        }
        router.push("/playlists")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to authenticate")
      }
    }

    exchangeCode()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Music2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Authenticating</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <>
              <p className="text-destructive text-center">{error}</p>
              <Button onClick={() => router.push("/")} className="w-full">
                Go back
              </Button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <CardDescription>Authenticating with Spotify...</CardDescription>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  )
}
