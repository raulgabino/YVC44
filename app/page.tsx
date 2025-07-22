"use client"

import { useState } from "react"
import SearchBar from "@/components/SearchBar"
import PlaceCard from "@/components/PlaceCard"
import VibeChips from "@/components/VibeChips"
import CitySelector from "@/components/CitySelector"
import type { Place } from "@/types/place"
import { mapFrontendToCanonical } from "@/lib/vibeMapping"

interface SearchState {
  query: string
  vibe: string
  city: string
  places: Place[]
  loading: boolean
  error: string | null
}

interface VibeAnalysisResult {
  vibe: string
  city: string
  confidence: number
}

export default function Home() {
  const [searchState, setSearchState] = useState<SearchState>({
    query: "",
    vibe: "",
    city: "cdmx", // Default ciudad
    places: [],
    loading: false,
    error: null,
  })

  // Búsqueda libre con análisis de IA
  const handleSearch = async () => {
    if (!searchState.query.trim()) return

    setSearchState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      places: [],
    }))

    try {
      console.log("🔍 Starting search for:", searchState.query)

      // 1. Analizar vibe y ciudad con IA
      const vibeResponse = await fetch("/api/vibe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchState.query }),
      })

      let vibeData: VibeAnalysisResult
      let searchCity = searchState.city // Default a ciudad seleccionada

      if (vibeResponse.ok) {
        vibeData = await vibeResponse.json()
        console.log("🧠 Vibe analysis result:", vibeData)
        // Si detectó ciudad, usarla; sino usar la seleccionada
        if (vibeData.city) {
          searchCity = vibeData.city.toLowerCase()
        }
      } else {
        console.warn("❌ Vibe analysis failed, using query as-is")
        vibeData = {
          vibe: searchState.query,
          city: searchCity,
          confidence: 0.5,
        }
      }

      // 2. Buscar lugares con vibe detectado
      const placesUrl = new URL("/api/places", window.location.origin)
      placesUrl.searchParams.set("vibe", vibeData.vibe)
      placesUrl.searchParams.set("city", searchCity)

      console.log("📍 Searching places:", placesUrl.toString())

      const placesResponse = await fetch(placesUrl.toString())
      let finalPlaces: Place[] = []

      if (placesResponse.ok) {
        const placesData = await placesResponse.json()
        finalPlaces = placesData.places || []
        console.log("🏠 Found places:", finalPlaces.length, placesData.debug)
      }

      // 3. Si no hay resultados locales, usar búsqueda con IA
      if (finalPlaces.length === 0) {
        console.log("🤖 No local results, trying AI search...")
        const searchResponse = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchState.query,
            vibe: vibeData.vibe,
            city: searchCity,
          }),
        })

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          finalPlaces = searchData.places || []
          console.log("🔮 AI search results:", finalPlaces.length)
        }
      }

      setSearchState((prev) => ({
        ...prev,
        places: finalPlaces,
        vibe: vibeData.vibe,
        city: searchCity,
        loading: false,
      }))
    } catch (error) {
      console.error("💥 Search error:", error)
      setSearchState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Error en búsqueda",
      }))
    }
  }

  // Búsqueda directa por vibe seleccionado
  const searchByVibe = async (selectedVibe: string) => {
    setSearchState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      places: [],
      vibe: selectedVibe,
    }))

    try {
      console.log("🎯 Searching by vibe:", selectedVibe, "in", searchState.city)

      // Mapear vibe del frontend a canónico
      const canonicalVibe = mapFrontendToCanonical(selectedVibe)
      console.log("📝 Mapped to canonical:", canonicalVibe)

      // Buscar lugares por vibe directo
      const placesUrl = new URL("/api/places", window.location.origin)
      placesUrl.searchParams.set("vibe", canonicalVibe)
      placesUrl.searchParams.set("city", searchState.city)

      const placesResponse = await fetch(placesUrl.toString())
      let finalPlaces: Place[] = []

      if (placesResponse.ok) {
        const placesData = await placesResponse.json()
        finalPlaces = placesData.places || []
        console.log("🏠 Vibe search results:", finalPlaces.length, placesData.debug)
      }

      // Fallback a AI search si no hay resultados
      if (finalPlaces.length === 0) {
        console.log("🤖 No vibe results, trying AI search...")
        const searchResponse = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `lugares para ${selectedVibe}`,
            vibe: canonicalVibe,
            city: searchState.city,
          }),
        })

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          finalPlaces = searchData.places || []
        }
      }

      setSearchState((prev) => ({
        ...prev,
        places: finalPlaces,
        loading: false,
        query: `${selectedVibe} en ${searchState.city.toUpperCase()}`,
      }))
    } catch (error) {
      console.error("💥 Vibe search error:", error)
      setSearchState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Error buscando por vibe",
      }))
    }
  }

  const handleVibeSelect = (vibe: string) => {
    if (searchState.vibe === vibe && searchState.places.length > 0) {
      return // No repetir búsqueda si ya está activo
    }
    searchByVibe(vibe)
  }

  const handleCitySelect = (city: string) => {
    console.log("🏙️ City changed to:", city)
    setSearchState((prev) => ({
      ...prev,
      city,
      places: [], // Limpiar resultados al cambiar ciudad
    }))
    // Si hay un vibe seleccionado, re-buscar con nueva ciudad
    if (searchState.vibe) {
      setTimeout(() => searchByVibe(searchState.vibe), 100)
    }
  }

  const handleQueryChange = (query: string) => {
    setSearchState((prev) => ({ ...prev, query }))
  }

  const resetSearch = () => {
    setSearchState({
      query: "",
      vibe: "",
      city: searchState.city, // Mantener ciudad seleccionada
      places: [],
      loading: false,
      error: null,
    })
  }

  const getEmptyStateMessage = () => {
    if (searchState.query && searchState.places.length === 0 && !searchState.loading && !searchState.error) {
      return {
        emoji: "🤔",
        title: "No encontramos lugares con ese vibe",
        subtitle: `Intenta: "quiero relajarme", "busco fiesta", "hambre de tacos" en ${searchState.city.toUpperCase()}`,
        action: "Nueva búsqueda",
      }
    }
    if (!searchState.query && searchState.places.length === 0) {
      return {
        emoji: "✨",
        title: "¡Descubre lugares increíbles!",
        subtitle: "Escribe cómo te sientes o selecciona un vibe",
        action: null,
      }
    }
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-400 via-yellow-500 to-red-500">
      <div className="min-h-screen bg-black/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">YourCityVibes</h1>
            <p className="text-lg text-gray-200 mb-4">Descubre tu vibra en la ciudad</p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* City Selector */}
            <CitySelector selectedCity={searchState.city} onCitySelect={handleCitySelect} />

            {/* Search Bar */}
            <SearchBar
              query={searchState.query}
              onQueryChange={handleQueryChange}
              onSearch={handleSearch}
              loading={searchState.loading}
            />

            {/* Vibe Chips */}
            <VibeChips selectedVibe={searchState.vibe} onVibeSelect={handleVibeSelect} />

            {/* Loading State */}
            {searchState.loading && (
              <div className="text-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400 mx-auto mb-6"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-yellow-600 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className="text-lg text-gray-200 mb-2">Buscando lugares con tu vibe...</p>
                <p className="text-sm text-gray-400">
                  {searchState.vibe && `Analizando: ${searchState.vibe} en ${searchState.city.toUpperCase()}`}
                </p>
              </div>
            )}

            {/* Error State */}
            {searchState.error && (
              <div className="max-w-md mx-auto">
                <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-6 text-center backdrop-blur-sm">
                  <div className="text-4xl mb-3">⚠️</div>
                  <h3 className="text-lg font-semibold text-red-300 mb-2">Ups, algo salió mal</h3>
                  <p className="text-red-200 mb-4">{searchState.error}</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setSearchState((prev) => ({ ...prev, error: null }))}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Reintentar
                    </button>
                    <button
                      onClick={resetSearch}
                      className="px-4 py-2 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-900/20 transition-colors"
                    >
                      Nueva búsqueda
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {!searchState.loading && !searchState.error && searchState.places.length > 0 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {searchState.places.length} lugares encontrados
                  </h2>
                  <p className="text-gray-300">
                    {searchState.vibe && (
                      <>
                        Perfectos para tu vibe: <span className="font-semibold text-green-400">{searchState.vibe}</span>{" "}
                        en{" "}
                      </>
                    )}
                    <span className="font-semibold text-yellow-400">{searchState.city.toUpperCase()}</span>
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchState.places.map((place) => (
                    <PlaceCard key={place.id} place={place} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty States */}
            {!searchState.loading &&
              !searchState.error &&
              (() => {
                const emptyState = getEmptyStateMessage()
                return emptyState ? (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">{emptyState.emoji}</div>
                    <h3 className="text-xl font-semibold text-white mb-2">{emptyState.title}</h3>
                    <p className="text-gray-300 mb-6 max-w-md mx-auto">{emptyState.subtitle}</p>
                    {emptyState.action && (
                      <button
                        onClick={resetSearch}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-yellow-500 text-black font-semibold rounded-xl hover:from-green-600 hover:to-yellow-600 transition-all duration-200 shadow-lg"
                      >
                        {emptyState.action}
                      </button>
                    )}
                  </div>
                ) : null
              })()}
          </div>
        </div>
      </div>
    </main>
  )
}
