"use client"

import { ExternalLink, Share2, Heart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import type { Place } from "@/types/place"

interface PlaceCardProps {
  place: Place
}

export function PlaceCard({ place }: PlaceCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [shareSuccess, setShareSuccess] = useState(false)
  const [showAllHours, setShowAllHours] = useState(false)

  // Check if place is favorited on mount
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem("ycv-favorites") || "[]")
    setIsFavorite(favorites.some((fav: Place) => fav.id === place.id))
  }, [place.id])

  const handleDirections = () => {
    const encodedAddress = encodeURIComponent(place.address)
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, "_blank")
  }

  const handleShare = async () => {
    const shareData = {
      title: place.name,
      text: `${place.description_short}\n📍 ${place.address}`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log("Error sharing:", err)
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}`)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
      } catch (err) {
        console.log("Error copying to clipboard:", err)
      }
    }
  }

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem("ycv-favorites") || "[]")

    if (isFavorite) {
      const updated = favorites.filter((fav: Place) => fav.id !== place.id)
      localStorage.setItem("ycv-favorites", JSON.stringify(updated))
      setIsFavorite(false)
    } else {
      const updated = [...favorites, place]
      localStorage.setItem("ycv-favorites", JSON.stringify(updated))
      setIsFavorite(true)
    }
  }

  const getVibeEmoji = (vibe: string) => {
    const emojiMap: Record<string, string> = {
      Traka: "🎉",
      Bellakeo: "😏",
      Tranqui: "😌",
      Godínez: "💼",
      Dominguero: "👨‍👩‍👧‍👦",
      Chambeador: "💻",
      Tóxico: "🖤",
      Dateo: "💕",
      Crudo: "🤒",
      Barbón: "🎩",
      Instagrameable: "📸",
    }
    return emojiMap[vibe] || "📍"
  }

  const getCurrentDay = () => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    return days[new Date().getDay()]
  }

  const formatDayName = (day: string) => {
    const dayNames: Record<string, string> = {
      monday: "Lunes",
      tuesday: "Martes",
      wednesday: "Miércoles",
      thursday: "Jueves",
      friday: "Viernes",
      saturday: "Sábado",
      sunday: "Domingo",
    }
    return dayNames[day] || day
  }

  const getHourStatus = (hour: string) => {
    if (!hour || hour === "No disponible") return { text: "No disponible", className: "text-muted-foreground" }
    if (hour.toLowerCase() === "cerrado") return { text: "Cerrado", className: "text-red-600" }
    return { text: hour, className: "text-foreground" }
  }

  return (
    <Card className="bg-[#181818] border-[#282828] hover:bg-[#282828] transition-all duration-300 group cursor-pointer">
      <CardContent className="p-0">
        <div className="flex items-center gap-4 p-4">
          {/* Imagen/Icono del lugar - lado izquierdo */}
          <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B35] to-[#F7931E] rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">{getVibeEmoji(place.playlists[0] || "Tranqui")}</span>
          </div>

          {/* Contenido principal - centro */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-white font-semibold truncate group-hover:text-[#FF6B35] transition-colors">
                {place.name}
              </h3>
              {place.source && (
                <Badge
                  variant={place.source === "local" ? "default" : "secondary"}
                  className={`text-xs ${
                    place.source === "local"
                      ? "bg-[#FF6B35] text-white hover:bg-[#FF6B35]"
                      : "bg-[#282828] text-[#B3B3B3] hover:bg-[#282828]"
                  }`}
                >
                  {place.source === "local" ? "🎯" : "🌐"}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-[#B3B3B3] text-sm mb-1">
              <span>{place.category}</span>
              <span>•</span>
              <span className="truncate">{place.city}</span>
            </div>
            <p className="text-[#B3B3B3] text-sm truncate">{place.description_short}</p>
            {/* Vibes tags */}
            {place.playlists && place.playlists.length > 0 && (
              <div className="flex gap-1 mt-2">
                {place.playlists.slice(0, 2).map((playlist) => (
                  <span
                    key={playlist}
                    className="inline-flex items-center gap-1 bg-[#282828] text-[#B3B3B3] px-2 py-1 rounded-full text-xs"
                  >
                    {getVibeEmoji(playlist)} {playlist}
                  </span>
                ))}
                {place.playlists.length > 2 && (
                  <span className="text-[#B3B3B3] text-xs self-center">+{place.playlists.length - 2}</span>
                )}
              </div>
            )}
          </div>

          {/* Acciones - lado derecho */}
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              onClick={toggleFavorite}
              variant="ghost"
              size="sm"
              className={`h-8 w-8 p-0 rounded-full hover:bg-[#333] ${isFavorite ? "text-[#FF6B35]" : "text-[#B3B3B3]"}`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
            <Button
              onClick={handleDirections}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-[#333] text-[#B3B3B3] hover:text-white"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleShare}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-[#333] text-[#B3B3B3] hover:text-white"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            {/* Play Button - Característico de Spotify */}
            <Button
              onClick={handleDirections}
              className="h-10 w-10 p-0 rounded-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white hover:scale-105 transition-all"
            >
              <svg className="h-5 w-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
