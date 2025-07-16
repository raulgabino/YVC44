"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Clock, X } from "lucide-react"

interface RecentSearchesProps {
  onSearchClick: (query: string) => void
  disabled?: boolean
}

export function RecentSearches({ onSearchClick, disabled }: RecentSearchesProps) {
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("ycv-recent-searches")
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  const addRecentSearch = (query: string) => {
    const updated = [query, ...recentSearches.filter((s) => s !== query)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem("ycv-recent-searches", JSON.stringify(updated))
  }

  const removeRecentSearch = (query: string) => {
    const updated = recentSearches.filter((s) => s !== query)
    setRecentSearches(updated)
    localStorage.setItem("ycv-recent-searches", JSON.stringify(updated))
  }

  const clearAll = () => {
    setRecentSearches([])
    localStorage.removeItem("ycv-recent-searches")
  }

  // Expose addRecentSearch function to parent
  useEffect(() => {
    ;(window as any).addRecentSearch = addRecentSearch
  }, [recentSearches])

  if (recentSearches.length === 0) return null

  return (
    <div className="max-w-2xl mx-auto mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Búsquedas recientes:</span>
        </div>
        <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs">
          Limpiar
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {recentSearches.map((search) => (
          <div key={search} className="flex items-center gap-1 bg-secondary rounded-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSearchClick(search)}
              disabled={disabled}
              className="text-xs px-3 py-1 h-auto rounded-l-full hover:bg-secondary/80"
            >
              {search}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeRecentSearch(search)}
              className="p-1 h-auto rounded-r-full hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
