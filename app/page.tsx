"use client"

import { useState } from "react"
import { SearchBar } from "@/components/SearchBar"
import { PlaceCard } from "@/components/PlaceCard"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorMessage } from "@/components/ErrorMessage"
import { FavoritesModal } from "@/components/FavoritesModal"
import { VibeDetector } from "@/components/VibeDetector"
import { VibeStats } from "@/components/VibeStats"
import type { Place } from "@/types/place"

interface VibeResponse {
  vibe: string
  city: string
  model_used?: string
  confidence?: string
}

export default function HomePage() {
  const [places, setPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [detectedVibe, setDetectedVibe] = useState<VibeResponse | null>(null)

  const handleSearch = async (query: string) => {
    setLoading(true)
    setSearchQuery(query)
    setError(null)
    setDetectedVibe(null)
    setPlaces([]) // Clear previous results

    try {
      // 1. Get vibe and city detection
      console.log("🔍 Step 1: Detecting vibe and city...")
      const vibeResponse = await fetch("/api/vibe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      if (!vibeResponse.ok) {
        throw new Error("Error detectando el vibe")
      }

      const vibeData: VibeResponse = await vibeResponse.json()
      setDetectedVibe(vibeData)
      console.log("✅ Vibe detected:", vibeData)

      // 2. Web Search First (Perplexity)
      console.log("🌐 Step 2: Trying web search first...")
      let webPlaces: Place[] = []

      try {
        const searchResponse = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vibe: vibeData.vibe, city: vibeData.city }),
        })

        if (searchResponse.ok) {
          webPlaces = await searchResponse.json()
          console.log(`🌐 Web search returned ${webPlaces.length} places`)
        } else {
          console.warn("⚠️ Web search API returned error status")
        }
      } catch (webError) {
        console.warn("⚠️ Web search failed:", webError)
      }

      // 3. If web search has results, use them. Otherwise, fallback to local data
      if (webPlaces.length > 0) {
        console.log("✅ Using web search results")
        setPlaces(webPlaces)
      } else {
        console.log("🔄 Web search returned no results. Using local data fallback...")

        try {
          const localResponse = await fetch("/api/places", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vibe: vibeData.vibe, city: vibeData.city }),
          })

          if (localResponse.ok) {
            const localPlaces = await localResponse.json()
            console.log(`🎯 Local search returned ${localPlaces.length} places`)

            if (localPlaces.length > 0) {
              setPlaces(localPlaces)
            } else {
              setError(`No encontramos lugares para "${vibeData.vibe}" en ${vibeData.city}. Intenta con otra búsqueda.`)
            }
          } else {
            console.error("❌ Local search API failed")
            setError(`No encontramos lugares para "${vibeData.vibe}" en ${vibeData.city}. Intenta con otra búsqueda.`)
          }
        } catch (localError) {
          console.error("❌ Local search error:", localError)
          setError(`No encontramos lugares para "${vibeData.vibe}" en ${vibeData.city}. Intenta con otra búsqueda.`)
        }
      }

      // Add to recent searches if we have results
      if (webPlaces.length > 0 || places.length > 0) {
        if (typeof window !== "undefined" && (window as any).addRecentSearch) {
          ;(window as any).addRecentSearch(query)
        }
      }
    } catch (error) {
      console.error("💥 Error in search process:", error)
      setError("Hubo un error al realizar la búsqueda. Por favor intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    if (searchQuery) {
      handleSearch(searchQuery)
    }
  }

  const localPlaces = places.filter((p) => p.source === "local")
  const webPlaces = places.filter((p) => p.source === "web")

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex justify-between items-center mb-6">
            <div></div> {/* Spacer */}
            <h1 className="text-4xl md:text-6xl font-bold text-primary">YCV Playlists</h1>
            <FavoritesModal />
          </div>
          <p className="text-xl text-muted-foreground mb-8">El Spotify de lugares. Encuentra tu vibe perfecto.</p>

          <SearchBar onSearch={handleSearch} disabled={loading} />
        </div>

        <VibeDetector
          query={searchQuery}
          vibe={detectedVibe?.vibe}
          city={detectedVibe?.city}
          modelUsed={detectedVibe?.model_used}
          confidence={detectedVibe?.confidence}
        />

        {!loading && !searchQuery && (
          <VibeStats
            currentVibe={detectedVibe?.vibe}
            currentCity={detectedVibe?.city}
            modelUsed={detectedVibe?.model_used}
            confidence={detectedVibe?.confidence}
          />
        )}

        {loading && <LoadingSpinner text="Buscando los mejores lugares para tu vibe..." />}

        {error && <ErrorMessage message={error} onRetry={handleRetry} />}

        {searchQuery && !loading && !error && places.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Resultados para: "{searchQuery}"</h2>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {places.length} lugar{places.length !== 1 ? "es" : ""} encontrado{places.length !== 1 ? "s" : ""}
                </span>
                {places.length > 0 && (
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                    {places[0].source === "web" ? "🌐 Búsqueda Web" : "🎯 Datos Locales"}
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-4">
              {places.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          </div>
        )}

        {searchQuery && !loading && !error && places.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg mb-4">No encontramos lugares que coincidan con tu búsqueda.</p>
            <p className="text-sm text-muted-foreground">Intenta con otro vibe o ciudad.</p>
          </div>
        )}
      </div>
    </div>
  )
}
