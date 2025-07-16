"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, Zap, Shield, Wrench, TrendingUp } from "lucide-react"

interface VibeStatsProps {
  currentVibe?: string
  currentCity?: string
  modelUsed?: string
  confidence?: string
}

interface SearchEntry {
  vibe: string
  city: string
  timestamp: number
  model_used?: string
  confidence?: string
}

export function VibeStats({ currentVibe, currentCity, modelUsed, confidence }: VibeStatsProps) {
  const [searchHistory, setSearchHistory] = useState<SearchEntry[]>([])

  useEffect(() => {
    const saved = localStorage.getItem("ycv-search-history")
    if (saved) {
      setSearchHistory(JSON.parse(saved))
    }
  }, [])

  useEffect(() => {
    if (currentVibe && currentCity) {
      const newEntry: SearchEntry = {
        vibe: currentVibe,
        city: currentCity,
        timestamp: Date.now(),
        model_used: modelUsed,
        confidence: confidence,
      }

      const updated = [newEntry, ...searchHistory].slice(0, 50) // Keep last 50 searches
      setSearchHistory(updated)
      localStorage.setItem("ycv-search-history", JSON.stringify(updated))
    }
  }, [currentVibe, currentCity, modelUsed, confidence])

  if (searchHistory.length === 0) return null

  // Calculate stats
  const vibeStats = searchHistory.reduce(
    (acc, entry) => {
      acc[entry.vibe] = (acc[entry.vibe] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const cityStats = searchHistory.reduce(
    (acc, entry) => {
      acc[entry.city] = (acc[entry.city] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const modelStats = searchHistory.reduce(
    (acc, entry) => {
      if (entry.model_used) {
        acc[entry.model_used] = (acc[entry.model_used] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )

  const topVibes = Object.entries(vibeStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  const topCities = Object.entries(cityStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  const getModelIcon = (model: string) => {
    switch (model) {
      case "o3-mini":
        return <Zap className="h-3 w-3" />
      case "gpt-4o-mini":
        return <Shield className="h-3 w-3" />
      case "manual":
        return <Wrench className="h-3 w-3" />
      default:
        return <BarChart3 className="h-3 w-3" />
    }
  }

  const totalSearches = searchHistory.length
  const highConfidenceSearches = searchHistory.filter((s) => s.confidence === "high").length
  const accuracyRate = totalSearches > 0 ? Math.round((highConfidenceSearches / totalSearches) * 100) : 0

  return (
    <Card className="mb-6 max-w-4xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Tu Perfil de Búsqueda
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalSearches}</div>
            <div className="text-sm text-muted-foreground">Búsquedas totales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{accuracyRate}%</div>
            <div className="text-sm text-muted-foreground">Precisión IA</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{Object.keys(vibeStats).length}</div>
            <div className="text-sm text-muted-foreground">Vibes explorados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{Object.keys(cityStats).length}</div>
            <div className="text-sm text-muted-foreground">Ciudades visitadas</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Vibes Favoritos</h4>
            <div className="space-y-2">
              {topVibes.map(([vibe, count]) => (
                <div key={vibe} className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {vibe}
                  </Badge>
                  <div className="flex items-center gap-2 flex-1 ml-2">
                    <Progress value={(count / totalSearches) * 100} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Ciudades Preferidas</h4>
            <div className="space-y-2">
              {topCities.map(([city, count]) => (
                <div key={city} className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {city}
                  </Badge>
                  <div className="flex items-center gap-2 flex-1 ml-2">
                    <Progress value={(count / totalSearches) * 100} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3 text-muted-foreground">Modelos IA Usados</h4>
            <div className="space-y-2">
              {Object.entries(modelStats).map(([model, count]) => (
                <div key={model} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getModelIcon(model)}
                    <span className="text-xs">{model}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 ml-2">
                    <Progress value={(count / totalSearches) * 100} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
