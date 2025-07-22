"use client"

import { useState } from "react"
import { SearchBar } from "@/components/SearchBar"
import { PlaceCard } from "@/components/PlaceCard"
import { VibeChips } from "@/components/VibeChips"
import { CitySelector } from "@/components/CitySelector"
import type { Place } from "@/types/place"

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
    city: "cdmx", // Default city
    places: [],
    loading: false,
    error: null,
  })

  // Función conectada a APIs reales
  const handleSearch = async () => {
    if (!searchState.query.trim()) return

    setSearchState((prev) => ({ ...prev, loading: true, error: null, places: [] }))

    try {
      console.log("Starting search with query:", searchState.query)

      // 1. Analizar vibe y ciudad con IA
      const vibeResponse = await fetch("/api/vibe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchState.query }),
      })

      console.log("Vibe response status:", vibeResponse.status)

      if (!vibeResponse.ok) {
        const errorText = await vibeResponse.text()
        console.error("Vibe API error:", errorText)
        throw new Error(`Error analizando búsqueda: ${vibeResponse.status} - ${errorText}`)
      }

      const vibeData: VibeAnalysisResult = await vibeResponse.json()
      console.log("Vibe analysis result:", vibeData)

      // 2. Buscar lugares con vibe detectado y ciudad seleccionada
      const placesUrl = new URL("/api/places", window.location.origin)
      placesUrl.searchParams.set("vibe", vibeData.vibe)
      placesUrl.searchParams.set("city", searchState.city) // Usar ciudad seleccionada

      console.log("Fetching places from:", placesUrl.toString())

      const placesResponse = await fetch(placesUrl.toString())

      if (!placesResponse.ok) {
        const errorText = await placesResponse.text()
        console.error("Places API error:", errorText)
        console.warn("Places API failed, will try AI search")
      }

      let finalPlaces: Place[] = []

      if (placesResponse.ok) {
        const placesData = await placesResponse.json()
        console.log("Places data:", placesData)
        finalPlaces = placesData.places || []
      }

      // 3. Si no hay resultados locales, usar búsqueda con IA
      if (finalPlaces.length === 0) {
        console.log("No local results, trying AI search...")
        const searchResponse = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: searchState.query,
            vibe: vibeData.vibe,
            city: searchState.city,
          }),
        })

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          finalPlaces = searchData.places || []
          console.log("AI search results:", finalPlaces.length, "places")
        } else {
          console.warn("AI search failed:", searchResponse.status)
          // Create mock results for testing
          finalPlaces = [
            {
              id: "mock-1",
              name: "Lugar de Ejemplo",
              category: "Café",
              address: "Calle Ejemplo 123",
              city: searchState.city,
              description_short: `Perfecto para tu vibe: ${vibeData.vibe}`,
              playlists: [vibeData.vibe, "ambiente"],
              rating: 4.5,
              source: "mock",
            },
          ]
        }
      }

      setSearchState((prev) => ({
        ...prev,
        places: finalPlaces,
        vibe: vibeData.vibe,
        loading: false,
      }))
    } catch (error) {
      console.error("Search error:", error)
      setSearchState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Error en búsqueda",
      }))
    }
  }

  // Función para buscar por vibe seleccionado directamente
  const searchByVibe = async (selectedVibe: string) => {
    setSearchState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      places: [],
      vibe: selectedVibe,
    }))

    try {
      console.log("Searching by vibe:", selectedVibe, "in city:", searchState.city)

      // Buscar lugares por vibe directo con ciudad seleccionada
      const placesUrl = new URL("/api/places", window.location.origin)
      placesUrl.searchParams.set("vibe", selectedVibe)
      placesUrl.searchParams.set("city", searchState.city)

      console.log("Fetching places by vibe from:", placesUrl.toString())

      const placesResponse = await fetch(placesUrl.toString())
      let finalPlaces: Place[] = []

      if (placesResponse.ok) {
        const placesData = await placesResponse.json()
        finalPlaces = placesData.places || []
      }

      // Si no hay resultados locales, usar búsqueda con IA o mock
      if (finalPlaces.length === 0) {
        console.log("No local results for vibe, trying AI search...")
        const searchResponse = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: `lugares para ${selectedVibe}`,
            vibe: selectedVibe,
            city: searchState.city,
          }),
        })

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          finalPlaces = searchData.places || []
          console.log("AI search results for vibe:", finalPlaces.length, "places")
        } else {
          console.warn("AI search for vibe failed, using mock data")
          // Create mock results for testing
          finalPlaces = [
            {
              id: `mock-${selectedVibe}-1`,
              name: `Lugar ${selectedVibe}`,
              category: selectedVibe === "Hambre" ? "Restaurante" : selectedVibe === "Chupe" ? "Bar y Cantina" : "Café",
              address: "Calle Ejemplo 123",
              city: searchState.city,
              description_short: `Perfecto para tu vibe: ${selectedVibe}`,
              playlists: [selectedVibe, "ambiente"],
              rating: 4.5,
              source: "mock",
            },
            {
              id: `mock-${selectedVibe}-2`,
              name: `Otro lugar ${selectedVibe}`,
              category:
                selectedVibe === "Bellakeo" ? "Antro" : selectedVibe === "Cultural" ? "Espacio Cultural" : "Café",
              address: "Avenida Ejemplo 456",
              city: searchState.city,
              description_short: `Ideal para cuando buscas ${selectedVibe}`,
              playlists: [selectedVibe, "música"],
              rating: 4.2,
              source: "mock",
            },
          ]
        }
      }

      setSearchState((prev) => ({
        ...prev,
        places: finalPlaces,
        loading: false,
        query: `${selectedVibe} en ${searchState.city}`, // Actualizar query para mostrar qué se buscó
      }))
    } catch (error) {
      console.error("Vibe search error:", error)
      setSearchState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Error buscando por vibe",
      }))
    }
  }

  const handleVibeSelect = (vibe: string) => {
    // Si es el mismo vibe, no hacer nada
    if (searchState.vibe === vibe && searchState.places.length > 0) {
      return
    }
    // Buscar lugares inmediatamente cuando se selecciona un vibe
    searchByVibe(vibe)
  }

  const handleCitySelect = (city: string) => {
    setSearchState((prev) => ({ ...prev, city, places: [], error: null }))
    // Si hay un vibe seleccionado, buscar de nuevo con la nueva ciudad
    if (searchState.vibe) {
      setTimeout(() => searchByVibe(searchState.vibe), 100)
    }
  }

  const handleQueryChange = (query: string) => {
    setSearchState((prev) => ({ ...prev, query }))
  }

  const getEmptyStateMessage = () => {
    if (searchState.query && searchState.places.length === 0 && !searchState.loading && !searchState.error) {
      return {
        emoji: "🤔",
        title: "No encontramos lugares con ese vibe",
        subtitle: 'Intenta con: "quiero relajarme", "busco fiesta", "hambre de tacos"',
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

  const resetSearch = () => {
    setSearchState((prev) => ({
      ...prev,
      query: "",
      vibe: "",
      places: [],
      error: null,
    }))
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            YourCityVibes
          </h1>
          <p className="text-lg text-gray-300 mb-8">El Spotify de lugares por vibes</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <CitySelector selectedCity={searchState.city} onCitySelect={handleCitySelect} />

          <SearchBar
            query={searchState.query}
            onQueryChange={handleQueryChange}
            onSearch={handleSearch}
            loading={searchState.loading}
          />

          <VibeChips selectedVibe={searchState.vibe} onVibeSelect={handleVibeSelect} />

          {/* Loading State */}
          {searchState.loading && (
            <div className="text-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-400 mx-auto mb-6"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              <p className="text-lg text-gray-200 mb-2">Buscando lugares con tu vibe...</p>
              <p className="text-sm text-gray-400">{searchState.vibe && `Analizando: ${searchState.vibe}`}</p>
            </div>
          )}

          {/* Error State */}
          {searchState.error && (
            <div className="max-w-md mx-auto">
              <div className="bg-red-900/50 border border-red-500/50 rounded-xl p-6 text-center backdrop-blur-sm">
                <div className="text-4xl mb-3">⚠️</div>
                <h3 className="text-lg font-semibold text-red-200 mb-2">Ups, algo salió mal</h3>
                <p className="text-red-300 mb-4">{searchState.error}</p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setSearchState((prev) => ({ ...prev, error: null }))}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reintentar
                  </button>
                  <button
                    onClick={resetSearch}
                    className="px-4 py-2 border border-red-400 text-red-200 rounded-lg hover:bg-red-900/30 transition-colors"
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
                <h2 className="text-2xl font-bold text-white mb-2">{searchState.places.length} lugares encontrados</h2>
                {searchState.vibe && (
                  <p className="text-gray-300">
                    Perfectos para tu vibe: <span className="font-semibold text-green-400">{searchState.vibe}</span>
                  </p>
                )}
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
                      className="px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-md"
                    >
                      {emptyState.action}
                    </button>
                  )}
                </div>
              ) : null
            })()}
        </div>
      </div>
    </main>
  )
}
