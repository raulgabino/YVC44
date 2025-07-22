"use client"

import { MapPin, Star, Clock, Phone } from "lucide-react"
import type { Place } from "@/types/place"

interface PlaceCardProps {
  place: Place
}

export default function PlaceCard({ place }: PlaceCardProps) {
  const formatRating = (rating?: number) => {
    return rating ? rating.toFixed(1) : "N/A"
  }

  const formatPrice = (priceRange?: string) => {
    const priceMap = {
      budget: "$",
      mid: "$$",
      high: "$$$",
      luxury: "$$$$",
    }
    return priceMap[priceRange as keyof typeof priceMap] || "$$"
  }

  const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase()
    if (lowerCategory.includes("café") || lowerCategory.includes("coffee")) return "☕"
    if (lowerCategory.includes("bar") || lowerCategory.includes("cantina")) return "🍺"
    if (lowerCategory.includes("restaurante") || lowerCategory.includes("comida")) return "🍽️"
    if (lowerCategory.includes("galería") || lowerCategory.includes("arte")) return "🎨"
    if (lowerCategory.includes("tienda") || lowerCategory.includes("shopping")) return "🛍️"
    return "📍"
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-all duration-200 group cursor-pointer border border-white/10">
      <div className="space-y-4">
        {/* Header con nombre y rating */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{getCategoryIcon(place.category)}</span>
              <h3 className="font-bold text-white text-xl truncate group-hover:text-green-400 transition-colors">
                {place.name}
              </h3>
            </div>
            <p className="text-gray-300 capitalize font-medium">{place.category}</p>
          </div>
          <div className="flex items-center gap-1 text-yellow-400 flex-shrink-0 ml-4">
            <Star className="w-5 h-5 fill-current" />
            <span className="font-bold">{formatRating(place.rating)}</span>
          </div>
        </div>

        {/* Información adicional */}
        <div className="space-y-2">
          {place.location && (
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{place.location}</span>
            </div>
          )}
          {place.hours && (
            <div className="flex items-center gap-2 text-gray-300">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm">Abierto ahora</span>
            </div>
          )}
          {place.phone && (
            <div className="flex items-center gap-2 text-gray-300">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{place.phone}</span>
            </div>
          )}
        </div>

        {/* Tags de vibes */}
        {place.playlists && place.playlists.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {place.playlists.slice(0, 3).map((vibe, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-green-500/20 text-green-300 text-xs rounded-full border border-green-500/30"
              >
                {vibe}
              </span>
            ))}
            {place.playlists.length > 3 && (
              <span className="px-3 py-1 bg-gray-500/20 text-gray-300 text-xs rounded-full border border-gray-500/30">
                +{place.playlists.length - 3} más
              </span>
            )}
          </div>
        )}

        {/* Footer con precio */}
        {place.priceRange && (
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span className="text-gray-400 text-sm">Precio aproximado</span>
            <span className="font-bold text-green-400 text-lg">{formatPrice(place.priceRange)}</span>
          </div>
        )}
      </div>
    </div>
  )
}
