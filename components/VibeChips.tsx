"use client"

import { useState } from "react"

interface VibeChipsProps {
  selectedVibe: string
  onVibeSelect: (vibe: string) => void
}

// ALINEADOS con el backend /api/vibe route.ts
const vibes = [
  { id: "Tranqui", label: "Tranqui", emoji: "😌" },
  { id: "Bellakeo", label: "Bellakeo", emoji: "🎉" },
  { id: "Romántico", label: "Romántico", emoji: "💕" },
  { id: "Godínez", label: "Trabajo", emoji: "💻" },
  { id: "Hambre", label: "Comida", emoji: "🍽️" },
  { id: "Chupe", label: "Drinks", emoji: "🍸" },
  { id: "Cultural", label: "Cultural", emoji: "🎨" },
  { id: "Deporte", label: "Deporte", emoji: "⚽" },
  { id: "Shopping", label: "Shopping", emoji: "🛍️" },
  { id: "Naturaleza", label: "Naturaleza", emoji: "🌳" },
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
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-200 mb-4 text-center">O elige tu vibe:</h3>
      <div className="flex flex-wrap justify-center gap-3">
        {vibes.map((vibe) => (
          <button
            key={vibe.id}
            onClick={() => handleChipClick(vibe.id)}
            aria-label={`Buscar lugares con vibe ${vibe.label}`}
            className={`
              px-4 py-2 rounded-full font-medium transition-all duration-200 transform
              flex items-center gap-2 min-w-fit border
              ${
                selectedVibe === vibe.id
                  ? "bg-green-500 text-black shadow-lg scale-105 border-green-400"
                  : "bg-white/10 text-gray-200 border-white/20 hover:border-green-400/50 hover:bg-white/15 hover:scale-105"
              }
              ${clickedVibe === vibe.id ? "scale-95" : ""}
            `}
          >
            <span className="text-lg">{vibe.emoji}</span>
            <span className="text-sm font-semibold">{vibe.label}</span>
          </button>
        ))}
      </div>
      {selectedVibe && (
        <div className="text-center mt-4">
          <p className="text-sm text-gray-300">
            Buscando lugares con vibe: <span className="font-bold text-green-400">{selectedVibe}</span>
          </p>
        </div>
      )}
    </div>
  )
}

export default VibeChips
