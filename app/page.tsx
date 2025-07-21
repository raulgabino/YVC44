"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { FixedSizeList as List } from "react-window"
import PlaceCardMini from "../components/PlaceCardMini"
import VibeChips from "../components/VibeChips"
import type { Place } from "../types/place"

interface SearchState {
  query: string
  vibe: string
  city: string
  places: Place[]
  loading: boolean
}

export default function HomePage() {
  const [searchState, setSearchState] = useState<SearchState>({
    query: "",
    vibe: "",
    city: "",
    places: [],
    loading: false,
  })

  const mockPlaces: Place[] = useMemo(
    () => [
      {
        id: "1",
        name: "Bar Perreo Loco",
        category: "Bar y Cantina",
        address: "Roma Norte, CDMX",
        city: "CDMX",
        description_short: "reggaeton y perreo toda la noche",
        playlists: ["reggaeton", "perreo"],
        rating: 4.5,
        source: "manual",
      },
      {
        id: "2",
        name: "Café Productivo",
        category: "Café",
        address: "Condesa, CDMX",
        city: "CDMX",
        description_short: "ambiente chill para trabajar",
        playlists: ["jazz", "chill"],
        rating: 4.2,
        source: "manual",
      },
    ],
    [],
  )

  const handleSearch = async () => {
    setSearchState((prev) => ({ ...prev, loading: true }))
    setTimeout(() => {
      setSearchState((prev) => ({
        ...prev,
        places: mockPlaces,
        loading: false,
      }))
    }, 500)
  }

  const handleVibeSelect = (vibe: string) => {
    setSearchState((prev) => ({ ...prev, vibe }))
  }

  const ListItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const place = searchState.places[index]
    return (
      <div style={style}>
        <div className="px-4 py-1">
          <PlaceCardMini place={place} onClick={() => console.log("Place clicked:", place.name)} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800">
      <div className="p-4">
        <h1 className="text-3xl font-bold text-white text-center mb-6">YourCityVibes</h1>
        <p className="text-white/80 text-center mb-6">Descubre tu vibra en la ciudad</p>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="bar bohemio en CDMX"
            className="flex-1 px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm text-white placeholder-white/60 border-0 focus:outline-none focus:ring-2 focus:ring-white/50"
            value={searchState.query}
            onChange={(e) => setSearchState((prev) => ({ ...prev, query: e.target.value }))}
          />
          <button
            onClick={handleSearch}
            disabled={searchState.loading}
            className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {searchState.loading ? "Buscando..." : "Buscar"}
          </button>
        </div>

        <VibeChips onVibeSelect={handleVibeSelect} selectedVibe={searchState.vibe} />
      </div>

      {searchState.places.length > 0 && (
        <div className="flex-1">
          <div className="px-4 mb-4">
            <h2 className="text-xl font-semibold text-white">Lugares recomendados ({searchState.places.length})</h2>
          </div>
          <List height={600} itemCount={searchState.places.length} itemSize={88} className="px-0">
            {ListItem}
          </List>
        </div>
      )}
    </div>
  )
}
