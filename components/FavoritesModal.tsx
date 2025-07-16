"use client"

import { useState, useEffect } from "react"
import { Heart, X, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import type { Place } from "@/types/place"

interface FavoritesModalProps {
  onPlaceSelect?: (place: Place) => void
}

export function FavoritesModal({ onPlaceSelect }: FavoritesModalProps) {
  const [favorites, setFavorites] = useState<Place[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const saved = JSON.parse(localStorage.getItem("ycv-favorites") || "[]")
      setFavorites(saved)
    }
  }, [isOpen])

  const removeFavorite = (placeId: number) => {
    const updated = favorites.filter((place) => place.id !== placeId)
    setFavorites(updated)
    localStorage.setItem("ycv-favorites", JSON.stringify(updated))
  }

  const clearAllFavorites = () => {
    setFavorites([])
    localStorage.removeItem("ycv-favorites")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 bg-transparent">
          <Heart className="h-4 w-4" />
          Favoritos ({favorites.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Lugares Favoritos</span>
            {favorites.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFavorites}
                className="text-destructive hover:text-destructive"
              >
                Limpiar todo
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {favorites.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No tienes lugares favoritos aún</p>
            <p className="text-sm text-muted-foreground mt-2">
              Guarda lugares que te gusten para encontrarlos fácilmente
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((place) => (
              <Card key={place.id} className="hover:bg-accent/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{place.name}</h4>
                        <Badge variant={place.source === "local" ? "default" : "secondary"} className="text-xs">
                          {place.source === "local" ? "🎯" : "🌐"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                        <MapPin className="h-3 w-3" />
                        <span>{place.address}</span>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">{place.description_short}</p>

                      <div className="flex flex-wrap gap-1">
                        {place.playlists.map((playlist) => (
                          <Badge key={playlist} variant="outline" className="text-xs">
                            {playlist}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFavorite(place.id)}
                      className="text-destructive hover:text-destructive ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
