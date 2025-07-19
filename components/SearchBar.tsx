"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Search, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  onSearch: (query: string) => void
  disabled?: boolean
}

export function SearchBar({ onSearch, disabled }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showRecent, setShowRecent] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent searches on mount
  useEffect(() => {
    const saved = localStorage.getItem("ycv-recent-searches")
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      performSearch(query.trim())
    }
  }

  const performSearch = (searchQuery: string) => {
    // Add to recent searches
    const updated = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem("ycv-recent-searches", JSON.stringify(updated))

    setQuery(searchQuery)
    setShowRecent(false)
    onSearch(searchQuery)
  }

  const clearQuery = () => {
    setQuery("")
    inputRef.current?.focus()
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem("ycv-recent-searches")
  }

  const suggestions = [
    "algo para bellaquear en gdl",
    "un lugar tranqui en la Roma",
    "donde desayunar crudo en Polanco",
    "un bar barbón en Monterrey",
    "café para chambear en la Condesa",
    "lugar dominguero en Santa Fe",
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#B3B3B3] h-5 w-5" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Ej: 'café tranquilo en Monterrey', 'bar bohemio en CDMX'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowRecent(true)}
            onBlur={() => setTimeout(() => setShowRecent(false), 200)}
            disabled={disabled}
            className="w-full pl-12 pr-24 py-4 text-lg bg-[#242424] border-[#3E3E3E] text-white placeholder-[#B3B3B3] focus:border-[#FF6B35] focus:ring-[#FF6B35] rounded-full"
          />
          <Button
            type="submit"
            disabled={disabled || !query.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#FF6B35] hover:bg-[#E55A2B] text-white px-6 py-2 rounded-full"
          >
            {disabled ? "..." : "Buscar"}
          </Button>
        </div>
      </form>

      {/* Recent searches dropdown */}
      {showRecent && recentSearches.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#282828] border border-[#3E3E3E] rounded-lg shadow-xl z-10">
          <div className="flex items-center justify-between p-4 border-b border-[#3E3E3E]">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#B3B3B3]" />
              <span className="text-sm font-medium text-white">Búsquedas recientes</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearRecentSearches}
              className="text-xs h-6 text-[#B3B3B3] hover:text-white"
            >
              Limpiar
            </Button>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => performSearch(search)}
                className="w-full text-left px-4 py-3 hover:bg-[#3E3E3E] text-sm text-[#B3B3B3] hover:text-white transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions mejoradas - estilo pills */}
      <div className="flex flex-wrap gap-2 justify-center mt-6">
        <span className="text-sm text-[#B3B3B3] mr-2 self-center">Prueba:</span>
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            variant="outline"
            size="sm"
            onClick={() => performSearch(suggestion)}
            disabled={disabled}
            className="text-xs bg-transparent border-[#3E3E3E] text-[#B3B3B3] hover:bg-[#FF6B35] hover:text-white hover:border-[#FF6B35] transition-all rounded-full"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  )
}
