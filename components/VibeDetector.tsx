"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Brain, MapPin, Zap, Shield, Wrench } from "lucide-react"

interface VibeDetectorProps {
  query: string
  vibe?: string
  city?: string
  modelUsed?: string
  confidence?: string
}

export function VibeDetector({ query, vibe, city, modelUsed, confidence }: VibeDetectorProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (vibe && city) {
      setIsVisible(true)
      const timer = setTimeout(() => setIsVisible(false), 10000)
      return () => clearTimeout(timer)
    }
  }, [vibe, city])

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
    }
    return emojiMap[vibe] || "📍"
  }

  const getVibeColor = (vibe: string) => {
    const colorMap: Record<string, string> = {
      Traka: "bg-red-500/20 text-red-700 border-red-500/30",
      Bellakeo: "bg-pink-500/20 text-pink-700 border-pink-500/30",
      Tranqui: "bg-green-500/20 text-green-700 border-green-500/30",
      Godínez: "bg-blue-500/20 text-blue-700 border-blue-500/30",
      Dominguero: "bg-orange-500/20 text-orange-700 border-orange-500/30",
      Chambeador: "bg-purple-500/20 text-purple-700 border-purple-500/30",
      Tóxico: "bg-gray-500/20 text-gray-700 border-gray-500/30",
      Dateo: "bg-rose-500/20 text-rose-700 border-rose-500/30",
      Crudo: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
      Barbón: "bg-indigo-500/20 text-indigo-700 border-indigo-500/30",
    }
    return colorMap[vibe] || "bg-primary/20 text-primary border-primary/30"
  }

  const getModelIcon = (model: string) => {
    switch (model) {
      case "o3-mini":
        return <Zap className="h-3 w-3" />
      case "gpt-4o-mini":
        return <Shield className="h-3 w-3" />
      case "manual":
        return <Wrench className="h-3 w-3" />
      default:
        return <Brain className="h-3 w-3" />
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "text-green-600"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-red-600"
      default:
        return "text-muted-foreground"
    }
  }

  if (!isVisible || !vibe || !city) return null

  return (
    <Card className="mb-6 max-w-2xl mx-auto border-primary/20 bg-primary/5 animate-in slide-in-from-top-2 duration-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Detectamos:</span>
          </div>

          <Badge className={`${getVibeColor(vibe)} border`}>
            {getVibeEmoji(vibe)} {vibe}
          </Badge>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline">{city}</Badge>
          </div>

          {/* Información del modelo y confianza */}
          {modelUsed && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getModelIcon(modelUsed)}
              <span>{modelUsed}</span>
              {confidence && (
                <>
                  <span>•</span>
                  <span className={getConfidenceColor(confidence)}>
                    {confidence === "high"
                      ? "Alta confianza"
                      : confidence === "medium"
                        ? "Confianza media"
                        : "Baja confianza"}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
