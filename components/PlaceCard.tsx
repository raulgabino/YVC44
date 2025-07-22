import type { Place } from "@/types/place"
import { MapPin, Star, Clock, Phone } from "lucide-react"

interface PlaceCardProps {
  place: Place
}

export function PlaceCard({ place }: PlaceCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Image placeholder */}
      <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
        <div className="text-6xl opacity-50">
          {place.category === "Café" && "☕"}
          {place.category === "Restaurante" && "🍽️"}
          {place.category === "Bar y Cantina" && "🍸"}
          {place.category === "Antro" && "🎵"}
          {place.category === "Boutique" && "🛍️"}
          {place.category === "Salón de Belleza" && "✂️"}
          {place.category === "Espacio Cultural" && "🎨"}
          {place.category === "Librería con Encanto" && "📚"}
          {![
            "Café",
            "Restaurante",
            "Bar y Cantina",
            "Antro",
            "Boutique",
            "Salón de Belleza",
            "Espacio Cultural",
            "Librería con Encanto",
          ].includes(place.category) && "📍"}
        </div>
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{place.name}</h3>
          {place.rating && (
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium">{place.rating}</span>
            </div>
          )}
        </div>

        {/* Category */}
        <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full mb-2">
          {place.category}
        </span>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{place.description_short}</p>

        {/* Address */}
        <div className="flex items-center gap-1 text-gray-500 text-sm mb-2">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{place.address}</span>
        </div>

        {/* Additional info */}
        <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
          {place.hours && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{place.hours}</span>
            </div>
          )}
          {place.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span>{place.phone}</span>
            </div>
          )}
          {place.price_range && <span className="px-2 py-1 bg-gray-100 rounded">{place.price_range}</span>}
        </div>

        {/* Playlists */}
        {place.playlists && place.playlists.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {place.playlists.slice(0, 3).map((playlist, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 text-xs rounded-full"
              >
                {playlist}
              </span>
            ))}
            {place.playlists.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{place.playlists.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default PlaceCard
