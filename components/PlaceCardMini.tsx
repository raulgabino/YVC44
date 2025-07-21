"use client"

import type { Place } from "../types/place"
import { Coffee, UtensilsCrossed, Wine, Music, ShoppingBag, Scissors, Palette, BookOpen } from "lucide-react"

interface PlaceCardMiniProps {
  place: Place
  onClick?: () => void
}

const CATEGORY_ICONS = {
  Café: Coffee,
  Restaurante: UtensilsCrossed,
  "Bar y Cantina": Wine,
  Antro: Music,
  Boutique: ShoppingBag,
  "Salón de Belleza": Scissors,
  "Espacio Cultural": Palette,
  "Librería con Encanto": BookOpen,
}

function getCategoryIcon(category: string) {
  const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || UtensilsCrossed
  return Icon
}

export default function PlaceCardMini({ place, onClick }: PlaceCardMiniProps) {
  const Icon = getCategoryIcon(place.category)

  return (
    <div
      className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl cursor-pointer hover:bg-white/20 transition-colors"
      onClick={onClick}
    >
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-white/20">
        <div className="w-full h-full flex items-center justify-center text-white/70">
          <Icon size={24} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-white text-sm truncate">{place.name}</h3>
        <p className="text-white/70 text-xs truncate">{place.description_short}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full text-white/80">{place.category}</span>
          {place.rating && <span className="text-xs text-yellow-300">⭐ {place.rating}</span>}
        </div>
      </div>
    </div>
  )
}
