"use client"

import { MapPin, SkipBack, SkipForward, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface NowPlayingBarProps {
  vibe?: string
  city?: string
  placesCount?: number
}

export function NowPlayingBar({ vibe, city, placesCount }: NowPlayingBarProps) {
  if (!vibe || !city) return null

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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#181818] border-t border-[#282828] p-4 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Vibe Info */}
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B35] to-[#F7931E] rounded flex items-center justify-center">
            <span className="text-xl">{getVibeEmoji(vibe)}</span>
          </div>
          <div>
            <div className="text-white font-medium">{vibe}</div>
            <div className="text-[#B3B3B3] text-sm flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {city} • {placesCount} lugares
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="text-[#B3B3B3] hover:text-white">
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button className="h-8 w-8 p-0 rounded-full bg-white text-black hover:scale-105 transition-all">
            <Play className="h-4 w-4 ml-0.5" />
          </Button>
          <Button variant="ghost" size="sm" className="text-[#B3B3B3] hover:text-white">
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Right side - placeholder */}
        <div className="flex-1 flex justify-end">
          <Button variant="ghost" size="sm" className="text-[#B3B3B3] hover:text-white">
            Ver en mapa
          </Button>
        </div>
      </div>
    </div>
  )
}
