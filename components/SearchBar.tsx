"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Search, Clock, X, Loader2 } from "lucide-react"

interface SearchBarProps {
  query: string
  onQueryChange: (query: string) => void
  onSearch: () => void
  loading?: boolean
}

export function SearchBar({ query, onQueryChange, onSearch, loading = false }: SearchBarProps) {
  const [suggestions] = useState([
    "quiero relajarme con un café",
    "busco fiesta nocturna",
    "tengo hambre de tacos",
    "necesito un lugar romántico",
    "quiero trabajar en un lugar tranquilo",
  ])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Cargar búsquedas recientes del localStorage
    const saved = localStorage.getItem("ycv-recent-searches")
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.warn("Error loading recent searches:", e)
      }
    }
  }, [])

  const handleSearch = () => {
    if (!query.trim() || loading) return

    // Guardar en búsquedas recientes
    const newRecent = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5)
    setRecentSearches(newRecent)
    localStorage.setItem("ycv-recent-searches", JSON.stringify(newRecent))
    setShowSuggestions(false)
    onSearch()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch()
    }
    if (e.key === "Escape") {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onQueryChange(suggestion)
    setShowSuggestions(false)
    // Auto-buscar después de seleccionar sugerencia
    setTimeout(() => {
      onSearch()
    }, 100)
  }

  const clearQuery = () => {
    onQueryChange("")
    inputRef.current?.focus()
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-8">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={loading ? "Buscando..." : "¿Qué vibe buscas? Ej: 'quiero relajarme'"}
          disabled={loading}
          className={`
            w-full pl-10 pr-20 py-4 text-lg rounded-2xl border-2 transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
            ${
              loading
                ? "bg-gray-50 border-gray-200 cursor-not-allowed"
                : "bg-white border-gray-200 hover:border-gray-300"
            }
          `}
        />
        {/* Clear Button */}
        {query && !loading && (
          <button
            onClick={clearQuery}
            className="absolute inset-y-0 right-16 flex items-center pr-2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className={`
            absolute inset-y-0 right-0 px-6 rounded-r-2xl font-medium transition-all duration-200
            ${
              query.trim() && !loading
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-md"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }
          `}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (query.length === 0 || !loading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Búsquedas recientes
              </h4>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(search)}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  {search}
                </button>
              ))}
            </div>
          )}
          {/* Suggestions */}
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-600 mb-2">Prueba estas búsquedas:</h4>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 rounded-lg"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchBar
