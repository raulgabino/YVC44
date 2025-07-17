"use client"

import { useState } from "react"
import { SearchBar } from "@/components/SearchBar"
import { PlaceCard } from "@/components/PlaceCard"
import { LoadingSpinner } from "@/components/LoadingSpinner"
import { ErrorMessage } from "@/components/ErrorMessage"
import { FavoritesModal } from "@/components/FavoritesModal"
import { VibeDetector } from "@/components/VibeDetector"
import { VibeStats } from "@/components/VibeStats"
import { NowPlayingBar } from "@/components/NowPlayingBar"
import { UserLibrary } from "@/components/UserLibrary"
import { VibePlaylists } from "@/components/VibePlaylists"
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

      // Guardar en historial después de detectar vibe
      const historyEntry = {
        query,
        vibe: vibeData.vibe,
        city: vibeData.city,
        timestamp: new Date().toISOString(),
        resultsCount: 0, // Se actualizará después
      }

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

        // Actualizar historial con número de resultados
        historyEntry.resultsCount = searchResults.length
        const currentHistory = JSON.parse(localStorage.getItem("ycv-search-history") || "[]")
        const updatedHistory = [historyEntry, ...currentHistory.filter((h: any) => h.query !== query)].slice(0, 20)
        localStorage.setItem("ycv-search-history", JSON.stringify(updatedHistory))
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
    <div className="min-h-screen bg-[#121212] text-white flex">
      {/* Sidebar Navigation - 240px fijo */}
      <aside className="w-60 bg-black p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">YCV Playlists</h1>
          <p className="text-[#B3B3B3] text-sm">El Spotify de lugares</p>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-4 mb-8">
          <div className="flex items-center gap-3 text-[#B3B3B3] hover:text-white cursor-pointer">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
            </svg>
            <span>Inicio</span>
          </div>
          <div className="flex items-center gap-3 text-white">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <span>Buscar</span>
          </div>
        </nav>

        {/* Tu Biblioteca - expandida */}
        <div className="flex-1 overflow-y-auto">
          <UserLibrary
            onSearchSelect={(query) => {
              setSearchQuery(query)
              handleSearch(query)
            }}
          />
        </div>

        {/* Vibes Recientes */}
        {detectedVibe && (
          <div className="mt-4">
            <h3 className="text-[#B3B3B3] text-sm font-medium mb-3">Vibe Activo</h3>
            <div className="bg-[#282828] rounded-lg p-3">
              <div className="text-white text-sm font-medium">{detectedVibe.vibe}</div>
              <div className="text-[#B3B3B3] text-xs">{detectedVibe.city}</div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-gradient-to-b from-[#1f1f1f] to-[#121212] p-6 pb-24">
        {/* Search Section */}
        <div className="mb-8">
          <SearchBar onSearch={handleSearch} disabled={loading} />
        </div>

        {/* Home Dashboard - cuando no hay búsqueda */}
        {!searchQuery && !loading && !error && (
          <div className="space-y-8">
            <VibePlaylists
              onVibeSelect={(vibe, city) => {
                const searchQuery = `lugares ${vibe.toLowerCase()} en ${city}`
                setSearchQuery(searchQuery)
                handleSearch(searchQuery)
              }}
            />
          </div>
        )}

        {/* Vibe Detector */}
        <VibeDetector
          query={searchQuery}
          vibe={detectedVibe?.vibe}
          city={detectedVibe?.city}
          modelUsed={detectedVibe?.model_used}
          confidence={detectedVibe?.confidence}
        />

        {/* Loading, Error y VibeStats */}
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

        {/* Results Section */}
        {searchQuery && !loading && !error && places.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Resultados para: "{searchQuery}"</h2>
              <span className="text-[#B3B3B3]">
                {places.length} lugar{places.length !== 1 ? "es" : ""} encontrado{places.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="grid gap-4">
              {places.map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          </div>
        )}

        {/* No results message */}
        {searchQuery && !loading && !error && places.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#B3B3B3] text-lg mb-4">No encontramos lugares que coincidan con tu búsqueda.</p>
            <p className="text-sm text-[#B3B3B3]">Intenta con otro vibe o ciudad.</p>
          </div>
        )}
      </main>

      {/* Right Panel */}
      <aside className="w-80 bg-[#121212] p-6 border-l border-[#282828]">
        <FavoritesModal />
        {detectedVibe && (
          <div className="mt-6">
            <h3 className="text-white font-medium mb-4">Vibe Actual</h3>
            <div className="bg-[#181818] rounded-lg p-4">
              <div className="text-[#FF6B35] font-bold text-lg">{detectedVibe.vibe}</div>
              <div className="text-[#B3B3B3] text-sm">📍 {detectedVibe.city}</div>
              {detectedVibe.confidence && (
                <div className="text-[#B3B3B3] text-xs mt-2">Confianza: {detectedVibe.confidence}</div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Now Playing Bar */}
      <NowPlayingBar vibe={detectedVibe?.vibe} city={detectedVibe?.city} placesCount={places.length} />
    </div>
  )
}
