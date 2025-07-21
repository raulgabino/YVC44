"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Phone, Clock, DollarSign, Star } from "lucide-react"

interface Place {
  id: number
  name: string
  category: string
  address: string
  city: string
  phone?: string
  hours?: string
  lat?: number
  lng?: number
  rating?: number
  price_range?: "$" | "$$" | "$$$"
  description_short: string
  playlists: string[]
  source: string
  place_id?: string
}

interface VibeData {
  vibe: string
  city: string
  confidence: number
}

export default function Home() {
  const [query, setQuery] = useState("")
  const [places, setPlaces] = useState<Place[]>([])
  const [vibeData, setVibeData] = useState<VibeData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatPriceRange = (priceRange?: string) => {
    if (!priceRange) return null
    return priceRange
  }

  const formatRating = (rating?: number) => {
    if (!rating) return null
    return rating.toFixed(1)
  }

  const handleSearch = async () => {
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setPlaces([])
    setVibeData(null)

    try {
      // Step 1: Detect vibe and city
      const vibeResponse = await fetch("/api/vibe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })

      if (!vibeResponse.ok) {
        throw new Error("Error detecting vibe")
      }

      const vibeData = await vibeResponse.json()
      setVibeData(vibeData)

      const { vibe, city } = vibeData

      // Step 2: Check if city was detected
      if (city === "unknown") {
        setError('Por favor especifica una ciudad en tu búsqueda. Ejemplo: "café tranquilo en Monterrey"')
        setIsLoading(false)
        return
      }

      // Step 3: Get places for the detected vibe and city
      const placesResponse = await fetch(
        `/api/places?vibe=${encodeURIComponent(vibe)}&city=${encodeURIComponent(city)}`,
      )

      if (!placesResponse.ok) {
        const errorData = await placesResponse.json()
        throw new Error(errorData.message || "Error fetching places")
      }

      const placesData = await placesResponse.json()
      setPlaces(placesData.places || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">YourCityVibes</h1>
          <p className="text-white/90 text-lg">Descubre tu vibra en la ciudad</p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Ej: 'café tranquilo en Monterrey', 'bar bohemio en CDMX'"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? "Buscando..." : "Buscar"}
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="pt-6">
                <p className="text-red-700 text-center">{error}</p>
                <p className="text-red-600 text-sm text-center mt-2">
                  Ciudades disponibles: CDMX, Monterrey, Guadalajara, San Miguel de Allende, Ciudad Victoria, Tijuana
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Vibe Detection Results */}
        {vibeData && (
          <div className="max-w-2xl mx-auto mb-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="pt-6">
                <div className="text-center text-white">
                  <p className="text-sm opacity-90">Detectamos tu vibra:</p>
                  <p className="text-xl font-semibold">
                    {vibeData.vibe} en {vibeData.city}
                  </p>
                  <p className="text-sm opacity-75">Confianza: {Math.round(vibeData.confidence * 100)}%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Places Results */}
        {places.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Lugares recomendados ({places.length})</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {places.map((place) => (
                <Card
                  key={place.id}
                  className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-colors"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-white text-lg">{place.name}</CardTitle>
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {place.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-white/90 text-sm">{place.description_short}</p>

                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-white/60" />
                        <span className="text-sm text-white/90">{place.address}</span>
                      </div>

                      {place.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-white/60" />
                          <span className="text-sm text-white/90">{place.phone}</span>
                        </div>
                      )}

                      {place.hours && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-white/60" />
                          <span className="text-sm text-white/90">{place.hours}</span>
                        </div>
                      )}

                      {(place.rating || place.price_range) && (
                        <div className="flex items-center gap-4">
                          {place.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-400" />
                              <span className="text-sm text-white/90">{formatRating(place.rating)}</span>
                            </div>
                          )}
                          {place.price_range && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4 text-green-400" />
                              <span className="text-sm text-white/90">{formatPriceRange(place.price_range)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1">
                        {place.playlists.map((playlist, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-white/30 text-white/80">
                            {playlist}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {!isLoading && places.length === 0 && vibeData && !error && (
          <div className="text-center text-white/80">
            <p>No se encontraron lugares para tu búsqueda.</p>
            <p className="text-sm mt-2">Intenta con una búsqueda diferente.</p>
          </div>
        )}
      </div>
    </div>
  )
}
