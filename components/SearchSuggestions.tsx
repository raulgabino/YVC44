"use client"

import { Button } from "@/components/ui/button"

interface SearchSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void
  disabled?: boolean
}

const suggestions = [
  "algo para bellaquear en gdl",
  "un lugar tranqui en la Roma",
  "donde chambear en Polanco",
  "un bar barbón en Monterrey",
  "café para la cruda en CDMX",
  "lugar para dateo en Guadalajara",
  "algo dominguero en la Condesa",
  "espacio cultural godínez",
]

export function SearchSuggestions({ onSuggestionClick, disabled }: SearchSuggestionsProps) {
  return (
    <div className="max-w-2xl mx-auto mt-6">
      <p className="text-sm text-muted-foreground mb-3 text-center">O prueba con estas sugerencias:</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion}
            variant="outline"
            size="sm"
            onClick={() => onSuggestionClick(suggestion)}
            disabled={disabled}
            className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  )
}
