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

      // 2. Try multiple search sources in order: Perplexity -> GPT -> Local
      let searchResults: Place[] = []
      let searchSource = ""

      // Try Perplexity first (if configured)
      if (process.env.PERPLEXITY_API_KEY) {
        console.log("🌐 Step 2a: Trying Perplexity web search...")
        try {
          const perplexityResponse = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vibe: vibeData.vibe, city: vibeData.city }),
          })

          if (perplexityResponse.ok) {
            const perplexityPlaces = await perplexityResponse.json()
            if (perplexityPlaces.length > 0) {
              searchResults = perplexityPlaces
              searchSource = "Perplexity Web Search"
              console.log(`🌐 Perplexity returned ${perplexityPlaces.length} places`)
            }
          }
        } catch (perplexityError) {
          console.warn("⚠️ Perplexity search failed:", perplexityError)
        }
      }

      // Try GPT search if Perplexity didn't work
      if (searchResults.length === 0) {
        console.log("🤖 Step 2b: Trying GPT search...")
        try {
          const gptResponse = await fetch("/api/search-gpt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vibe: vibeData.vibe, city: vibeData.city }),
          })

          if (gptResponse.ok) {
            const gptPlaces = await gptResponse.json()
            if (gptPlaces.length > 0) {
              searchResults = gptPlaces
              searchSource = "GPT Recommendations"
              console.log(`🤖 GPT returned ${gptPlaces.length} places`)
            }
          }
        } catch (gptError) {
          console.warn("⚠️ GPT search failed:", gptError)
        }
      }

      // Fallback to local data if both web searches failed
      if (searchResults.length === 0) {
        console.log("🎯 Step 2c: Using local data fallback...")
        try {
          const localResponse = await fetch("/api/places", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vibe: vibeData.vibe, city: vibeData.city }),
          })

          if (localResponse.ok) {
            const localPlaces = await localResponse.json()
            if (localPlaces.length > 0) {
              searchResults = localPlaces
              searchSource = "Curated Local Data"
              console.log(`🎯 Local search returned ${localPlaces.length} places`)
            }
          }
        } catch (localError) {
          console.error("❌ Local search error:", localError)
        }
      }

      // Set results or error
      if (searchResults.length > 0) {
        setPlaces(searchResults)
        console.log(`✅ Using ${searchSource}`)
      } else {
        setError(`No encontramos lugares para "${vibeData.vibe}" en ${vibeData.city}. Intenta con otra búsqueda.`)
      }

      // Add to recent searches if we have results
      if (searchResults.length > 0 && typeof window !== "undefined" && (window as any).addRecentSearch) {
        ;(window as any).addRecentSearch(query)
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

  const getSourceIcon = (source: Place["source"]) => {
    switch (source) {
      case "web":
        return "🌐"
      case "gpt":
        return "🤖"
      case "local":
        return "🎯"
      default:
        return "📍"
    }
  }

  const getSourceLabel = (source: Place["source"]) => {
    switch (source) {
      case "web":
        return "Búsqueda Web"
      case "gpt":
        return "GPT Recommendations"
      case "local":
        return "Datos Curados"
      default:
        return "Desconocido"
    }
  }

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
                    {getSourceIcon(places[0].source)} {getSourceLabel(places[0].source)}
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
