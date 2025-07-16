"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Place } from "@/types/place"

interface PlaceStatsProps {
  places: Place[]
  searchQuery: string
}

export function PlaceStats({ places, searchQuery }: PlaceStatsProps) {
  if (places.length === 0) return null

  const localCount = places.filter((p) => p.source === "local").length
  const webCount = places.filter((p) => p.source === "web").length

  const categoryStats = places.reduce(
    (acc, place) => {
      acc[place.category] = (acc[place.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const vibeStats = places.reduce(
    (acc, place) => {
      place.playlists.forEach((vibe) => {
        acc[vibe] = (acc[vibe] || 0) + 1
      })
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <Card className="mb-6 bg-accent/20">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-2">Fuentes</h4>
            <div className="flex gap-2">
              {localCount > 0 && (
                <Badge variant="default" className="text-xs">
                  🎯 {localCount} curada{localCount !== 1 ? "s" : ""}
                </Badge>
              )}
              {webCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  🌐 {webCount} web
                </Badge>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Categorías</h4>
            <div className="flex flex-wrap gap-1">
              {Object.entries(categoryStats).map(([category, count]) => (
                <Badge key={category} variant="outline" className="text-xs">
                  {category} ({count})
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Vibes</h4>
            <div className="flex flex-wrap gap-1">
              {Object.entries(vibeStats).map(([vibe, count]) => (
                <Badge key={vibe} variant="outline" className="text-xs">
                  {vibe} ({count})
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
