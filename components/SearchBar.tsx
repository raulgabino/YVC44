"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Search, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  onSearch: (query: string) => void
  disabled?: boolean
  placeholder?: string
}

export function SearchBar({ onSearch, disabled, placeholder = "Busca un lugar o experiencia..." }: SearchBarProps) {
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
      <form onSubmit={handleSubmit} className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#B3B3B3] h-5 w-5" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowRecent(true)}
            onBlur={() => setTimeout(() => setShowRecent(false), 200)}
            className="pl-12 pr-12 h-14 text-lg bg-[#242424] border-[#3E3E3E] text-white placeholder-[#B3B3B3] focus:bg-[#2A2A2A] focus:border-[#FF6B35] rounded-full"
            disabled={disabled}
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearQuery}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-[#B3B3B3] hover:text-white rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          )}

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
        </div>
        <Button
          type="submit"
          disabled={disabled || !query.trim()}
          className="h-14 px-8 bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-medium rounded-full disabled:bg-[#3E3E3E] disabled:text-[#727272]"
        >
          Buscar
        </Button>
      </form>

      {/* Suggestions mejoradas - estilo pills */}
      <div className="flex flex-wrap gap-2 justify-center">
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
