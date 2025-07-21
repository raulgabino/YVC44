"use client"

import { useState, useEffect } from "react"

interface VibeChipsProps {
  onVibeSelect: (vibe: string) => void
  selectedVibe?: string
}

const VIBE_TOKENS = [
  "Bellaquear",
  "Chill",
  "Productivo",
  "Romanticón",
  "Turista",
  "Shopear",
  "Fiesta",
  "Tranqui",
  "Aesthetic",
  "Vintage",
  "Lounge",
  "Boho",
]

export default function VibeChips({ onVibeSelect, selectedVibe }: VibeChipsProps) {
  const [randomVibes, setRandomVibes] = useState<string[]>([])

  useEffect(() => {
    const shuffled = [...VIBE_TOKENS].sort(() => 0.5 - Math.random())
    setRandomVibes(shuffled.slice(0, 5))
  }, [])

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {randomVibes.map((vibe) => (
        <button
          key={vibe}
          onClick={() => onVibeSelect(vibe)}
          className={`
            px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200
            ${selectedVibe === vibe ? "bg-white text-purple-600 shadow-lg" : "bg-white/20 text-white hover:bg-white/30"}
          `}
        >
          {vibe}
        </button>
      ))}
      <button
        onClick={() => {
          const shuffled = [...VIBE_TOKENS].sort(() => 0.5 - Math.random())
          setRandomVibes(shuffled.slice(0, 5))
        }}
        className="px-3 py-1.5 rounded-full text-sm font-medium bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
      >
        🎲 Más
      </button>
    </div>
  )
}
