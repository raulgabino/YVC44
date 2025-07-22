"use client"

import { useState } from "react"

interface VibeChipsProps {
  selectedVibe: string
  onVibeSelect: (vibe: string) => void
}

const vibes = [
  { id: "chill", label: "Chill", emoji: "😌" },
  { id: "party", label: "Fiesta", emoji: "🎉" },
  { id: "romantic", label: "Romántico", emoji: "💕" },
  { id: "work", label: "Trabajo", emoji: "💻" },
  { id: "food", label: "Comida", emoji: "🍽️" },
  { id: "drinks", label: "Drinks", emoji: "🍸" },
  { id: "culture", label: "Cultural", emoji: "🎨" },
  { id: "sport", label: "Deporte", emoji: "⚽" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "nature", label: "Naturaleza", emoji: "🌳" },
]

export function VibeChips({ selectedVibe, onVibeSelect }: VibeChipsProps) {
  const [clickedVibe, setClickedVibe] = useState<string | null>(null)

  const handleChipClick = (vibeId: string) => {
    // Feedback visual inmediato
    setClickedVibe(vibeId)
    setTimeout(() => setClickedVibe(null), 200)
    // Llamar función de búsqueda
    onVibeSelect(vibeId)
  }

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">O elige tu vibe:</h3>
      <div className="flex flex-wrap justify-center gap-3">
        {vibes.map((vibe) => (
          <button
            key={vibe.id}
            onClick={() => handleChipClick(vibe.id)}
            className={`
              px-4 py-2 rounded-full font-medium transition-all duration-200 transform
              flex items-center gap-2 min-w-fit
              ${
                selectedVibe === vibe.id
                  ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105"
                  : "bg-white text-gray-700 border border-gray-200 hover:border-purple-300 hover:shadow-md hover:scale-105"
              }
              ${clickedVibe === vibe.id ? "scale-95" : ""}
            `}
          >
            <span className="text-lg">{vibe.emoji}</span>
            <span className="text-sm">{vibe.label}</span>
          </button>
        ))}
      </div>
      {selectedVibe && (
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Mostrando lugares para: <span className="font-semibold text-purple-600">{selectedVibe}</span>
          </p>
        </div>
      )}
    </div>
  )
}

export default VibeChips
