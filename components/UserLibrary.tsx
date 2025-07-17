"use client"

import { useState, useEffect } from "react"
import { Clock, MapPin, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SearchHistory {
  query: string
  vibe: string
  city: string
  timestamp: string
  resultsCount: number
}

interface UserLibraryProps {
  onSearchSelect: (query: string) => void
}

export function UserLibrary({ onSearchSelect }: UserLibraryProps) {
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [favorites, setFavorites] = useState([])

  useEffect(() => {
    // Load search history from localStorage
    const history = JSON.parse(localStorage.getItem("ycv-search-history") || "[]")
    setSearchHistory(history.slice(0, 10)) // últimas 10 búsquedas

    // Load favorites
    const favs = JSON.parse(localStorage.getItem("ycv-favorites") || "[]")
    setFavorites(favs)
  }, [])

  const clearHistory = () => {
    localStorage.removeItem("ycv-search-history")
    setSearchHistory([])
  }

  const getVibeEmoji = (vibe: string) => {
    const emojiMap: Record<string, string> = {
      Traka: "🎉",
      Bellakeo: "😏",
      Tranqui: "😌",
      Godínez: "💼",
      Dominguero: "👨‍👩‍👧‍👦",
      Chambeador: "💻",
      Tóxico: "🖤",
      Dateo: "💕",
      Crudo: "🤒",
      Barbón: "🎩",
      Instagrameable: "📸",
    }
    return emojiMap[vibe] || "📍"
  }

  return (
    <div className="space-y-6">
      {/* Lugares Guardados */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Lugares Guardados</h3>
          <span className="text-[#B3B3B3] text-sm">{favorites.length}</span>
        </div>
        {favorites.length === 0 ? (
          <p className="text-[#B3B3B3] text-sm">Aún no tienes lugares guardados</p>
        ) : (
          <div className="space-y-2">
            {favorites.slice(0, 5).map((place: any, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-[#1A1A1A] hover:bg-[#242424] transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B35] to-[#F7931E] rounded flex items-center justify-center">
                  <span className="text-sm">{getVibeEmoji(place.playlists?.[0] || "Tranqui")}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">{place.name}</div>
                  <div className="text-[#B3B3B3] text-xs truncate">
                    {place.category} • {place.city}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Búsquedas Recientes */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Búsquedas Recientes</h3>
          {searchHistory.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-[#B3B3B3] hover:text-white text-xs h-6"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Limpiar
            </Button>
          )}
        </div>
        {searchHistory.length === 0 ? (
          <p className="text-[#B3B3B3] text-sm">No hay búsquedas recientes</p>
        ) : (
          <div className="space-y-2">
            {searchHistory.map((search, index) => (
              <button
                key={index}
                onClick={() => onSearchSelect(search.query)}
                className="w-full text-left p-3 rounded-lg bg-[#1A1A1A] hover:bg-[#242424] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#282828] rounded flex items-center justify-center">
                    <span className="text-sm">{getVibeEmoji(search.vibe)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate group-hover:text-[#FF6B35]">
                      {search.query}
                    </div>
                    <div className="text-[#B3B3B3] text-xs flex items-center gap-2">
                      <span>{search.vibe}</span>
                      <span>•</span>
                      <MapPin className="h-3 w-3" />
                      <span>{search.city}</span>
                      <span>•</span>
                      <span>{search.resultsCount} lugares</span>
                    </div>
                  </div>
                  <Clock className="h-4 w-4 text-[#B3B3B3] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
