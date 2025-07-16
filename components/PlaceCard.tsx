"use client"

import { MapPin, Tag, ExternalLink, Share2, Heart, Phone, Clock, ChevronDown, ChevronUp } from "lucide-react"
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
      Traca: "🎉",
      Bellaqueo: "😏",
      Tranqui: "😌",
      Godínez: "💼",
      Dominguero: "👨‍👩‍👧‍👦",
      Chambeador: "💻",
      Tóxico: "🖤",
      Dateo: "💕",
      Crudo: "🤒",
      Barbón: "🎩",
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
    <Card className="hover:bg-accent/50 transition-all duration-200 hover:shadow-md group">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">{place.name}</h3>
              {place.source && (
                <Badge variant={place.source === "local" ? "default" : "secondary"}>
                  {place.source === "local" ? "🎯 Curada" : "🌐 Web"}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Tag className="h-4 w-4" />
              <span className="text-sm">{place.category}</span>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground mb-3">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{place.address}</span>
            </div>

            <p className="text-foreground mb-4 leading-relaxed">{place.description_short}</p>

            {/* Información de contacto y horarios */}
            <div className="space-y-3 mb-4">
              {/* Teléfono */}
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {place.phone ? (
                  <a href={`tel:${place.phone}`} className="text-primary hover:underline">
                    {place.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">No disponible</span>
                )}
              </div>

              {/* Horarios */}
              {place.hours && (
                <div className="space-y-2">
                  {/* Horario de hoy */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Hoy:</span>
                    <span className={getHourStatus(place.hours[getCurrentDay() as keyof typeof place.hours]).className}>
                      {getHourStatus(place.hours[getCurrentDay() as keyof typeof place.hours]).text}
                    </span>
                  </div>

                  {/* Botón ver todos los horarios */}
                  <button
                    onClick={() => setShowAllHours(!showAllHours)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    Ver todos los horarios
                    {showAllHours ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>

                  {/* Horarios expandidos */}
                  {showAllHours && (
                    <div className="grid grid-cols-1 gap-1 p-3 bg-accent/20 rounded-lg text-xs">
                      {Object.entries(place.hours).map(([day, hour]) => (
                        <div key={day} className="flex justify-between items-center">
                          <span className="font-medium">{formatDayName(day)}:</span>
                          <span className={getHourStatus(hour).className}>{getHourStatus(hour).text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {place.playlists && place.playlists.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {place.playlists.map((playlist) => (
                  <Badge key={playlist} variant="outline" className="text-xs">
                    {getVibeEmoji(playlist)} {playlist}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <Button
                onClick={handleDirections}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-transparent"
              >
                <ExternalLink className="h-4 w-4" />
                Cómo llegar
              </Button>

              <Button onClick={handleShare} variant="ghost" size="sm" className="flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                {shareSuccess ? "¡Copiado!" : "Compartir"}
              </Button>

              <Button
                onClick={toggleFavorite}
                variant="ghost"
                size="sm"
                className={`flex items-center gap-2 ${isFavorite ? "text-red-500 hover:text-red-600" : ""}`}
              >
                <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
                {isFavorite ? "Guardado" : "Guardar"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
