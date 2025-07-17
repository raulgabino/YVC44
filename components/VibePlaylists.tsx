"use client"

import { Card, CardContent } from "@/components/ui/card"

interface VibePlaylistsProps {
  onVibeSelect: (vibe: string, city: string) => void
}

export function VibePlaylists({ onVibeSelect }: VibePlaylistsProps) {
  const featuredPlaylists = [
    {
      id: 1,
      name: "Mix Godínez CDMX",
      description: "Los mejores lugares para después del trabajo",
      vibe: "Godínez",
      city: "CDMX",
      gradient: "from-blue-500 to-blue-700",
      emoji: "💼",
    },
    {
      id: 2,
      name: "Bellakeo Nocturno",
      description: "Para conquistar la noche en cualquier ciudad",
      vibe: "Bellakeo",
      city: "CDMX",
      gradient: "from-purple-500 to-pink-600",
      emoji: "😏",
    },
    {
      id: 3,
      name: "Dominguero Familiar",
      description: "Lugares perfectos para el fin de semana",
      vibe: "Dominguero",
      city: "Monterrey",
      gradient: "from-green-500 to-emerald-600",
      emoji: "👨‍👩‍👧‍👦",
    },
    {
      id: 4,
      name: "Crudo Recovery",
      description: "Para curar la resaca como Dios manda",
      vibe: "Crudo",
      city: "Guadalajara",
      gradient: "from-yellow-500 to-orange-500",
      emoji: "🤒",
    },
    {
      id: 5,
      name: "Barbón Premium",
      description: "Los lugares más exclusivos y sofisticados",
      vibe: "Barbón",
      city: "CDMX",
      gradient: "from-amber-500 to-yellow-600",
      emoji: "🎩",
    },
    {
      id: 6,
      name: "Tranqui Afternoon",
      description: "Para relajarse y desconectar del estrés",
      vibe: "Tranqui",
      city: "Mérida",
      gradient: "from-teal-500 to-cyan-600",
      emoji: "😌",
    },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Playlists Destacadas</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {featuredPlaylists.map((playlist) => (
          <Card
            key={playlist.id}
            className="bg-[#181818] border-[#282828] hover:bg-[#242424] transition-all duration-300 group cursor-pointer"
          >
            <CardContent className="p-0">
              <button onClick={() => onVibeSelect(playlist.vibe, playlist.city)} className="w-full text-left">
                <div className={`h-32 bg-gradient-to-br ${playlist.gradient} rounded-t-lg relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute bottom-4 left-4">
                    <span className="text-4xl">{playlist.emoji}</span>
                  </div>
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 bg-[#FF6B35] rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-medium mb-1 group-hover:text-[#FF6B35] transition-colors">
                    {playlist.name}
                  </h3>
                  <p className="text-[#B3B3B3] text-sm leading-relaxed">{playlist.description}</p>
                </div>
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
