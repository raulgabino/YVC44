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

    try {
      // Llamar al endpoint de vibe para detectar vibe y ciudad
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

      // Realizar búsquedas en paralelo con timeout
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000))

      const [localResponse, searchResponse] = await Promise.allSettled([
        Promise.race([
          fetch("/api/places", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vibe: vibeData.vibe, city: vibeData.city }),
          }),
          timeoutPromise,
        ]),
        Promise.race([
          fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ vibe: vibeData.vibe, city: vibeData.city }),
          }),
          timeoutPromise,
        ]),
      ])

      let localPlaces: Place[] = []
      let webPlaces: Place[] = []

      // Procesar resultados locales
      if (localResponse.status === "fulfilled" && localResponse.value.ok) {
        localPlaces = await localResponse.value.json()
      }

      // Procesar resultados web
      if (searchResponse.status === "fulfilled" && searchResponse.value.ok) {
        webPlaces = await searchResponse.value.json()
      } else if (searchResponse.status === "rejected") {
        console.warn("Web search failed:", searchResponse.reason)
      }

      // Combinar resultados (locales primero)
      const combinedResults = [...localPlaces, ...webPlaces]

      if (combinedResults.length === 0) {
        setError(`No encontramos lugares para "${vibeData.vibe}" en ${vibeData.city}. Intenta con otra búsqueda.`)
      }

      setPlaces(combinedResults)
    } catch (error) {
      console.error("Error searching:", error)
      setError("Hubo un error en la búsqueda. Por favor intenta de nuevo.")
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
              <span className="text-muted-foreground">
                {places.length} lugar{places.length !== 1 ? "es" : ""} encontrado{places.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Mostrar resultados locales primero */}
            {localPlaces.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-medium mb-4 text-primary flex items-center gap-2">
                  🎯 Recomendaciones Curadas
                  <span className="text-sm bg-primary/20 text-primary px-2 py-1 rounded-full">
                    {localPlaces.length}
                  </span>
                </h3>
                <div className="grid gap-4">
                  {localPlaces.map((place) => (
                    <PlaceCard key={place.id} place={place} />
                  ))}
                </div>
              </div>
            )}

            {/* Mostrar resultados web después */}
            {webPlaces.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-4 text-secondary-foreground flex items-center gap-2">
                  🌐 Encontrado en la Web
                  <span className="text-sm bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                    {webPlaces.length}
                  </span>
                </h3>
                <div className="grid gap-4">
                  {webPlaces.map((place) => (
                    <PlaceCard key={place.id} place={place} />
                  ))}
                </div>
              </div>
            )}
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
