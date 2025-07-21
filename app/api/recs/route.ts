import { type NextRequest, NextResponse } from "next/server"
import { scorePlace } from "./score"

export const runtime = "edge"

interface Place {
  id: string
  name: string
  category: string
  address: string
  city: string
  description_short: string
  playlists: string[]
  lat?: number
  lng?: number
  rating?: number
  hours?: string
  source: string
  price_range?: string
}

interface ScoredPlace extends Place {
  score: number
}

export async function POST(request: NextRequest) {
  try {
    const { vibe, city, userCoords, limit = 5 } = await request.json()

    if (!vibe || !city) {
      return NextResponse.json({ error: "Missing required fields: vibe, city" }, { status: 400 })
    }

    // TODO: Load places from JSON chunks in /public/data/{city}.json
    const mockPlaces: Place[] = [
      {
        id: "1",
        name: "Bar Perreo Loco",
        category: "Bar y Cantina",
        address: "Roma Norte, CDMX",
        city: "CDMX",
        description_short: "reggaeton y perreo toda la noche",
        playlists: ["reggaeton", "perreo"],
        lat: 19.4326,
        lng: -99.1332,
        rating: 4.5,
        hours: "20:00-02:00",
        source: "manual",
        price_range: "$$",
      },
      {
        id: "2",
        name: "Café Productivo",
        category: "Café",
        address: "Condesa, CDMX",
        city: "CDMX",
        description_short: "ambiente chill para trabajar",
        playlists: ["jazz", "chill"],
        lat: 19.415,
        lng: -99.17,
        rating: 4.2,
        hours: "07:00-22:00",
        source: "manual",
        price_range: "$$",
      },
      {
        id: "3",
        name: "Antro VIP",
        category: "Antro",
        address: "Zona Rosa, CDMX",
        city: "CDMX",
        description_short: "fiesta y reggaeton hasta el amanecer",
        playlists: ["reggaeton", "electronica"],
        lat: 19.42,
        lng: -99.16,
        rating: 4.0,
        hours: "22:00-04:00",
        source: "manual",
        price_range: "$$$",
      },
      {
        id: "4",
        name: "Pujol",
        category: "Fine Dining",
        address: "Tennyson 133, Polanco, CDMX",
        city: "CDMX",
        description_short: "alta cocina mexicana contemporánea, experiencia gourmet única",
        playlists: ["Fine Dining", "Alta Cocina", "Gourmet"],
        lat: 19.4326,
        lng: -99.1956,
        rating: 4.8,
        hours: "13:30-16:00, 19:00-22:00",
        source: "manual",
        price_range: "$$$$",
      },
    ]

    const cityPlaces = mockPlaces.filter((p) => p.city.toLowerCase() === city.toLowerCase())

    if (cityPlaces.length === 0) {
      return NextResponse.json({ error: `No places found for city: ${city}` }, { status: 404 })
    }

    const scoredPlaces: ScoredPlace[] = cityPlaces
      .map((place) => ({
        ...place,
        score: scorePlace(place, vibe, userCoords),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    return NextResponse.json({
      vibe,
      city,
      places: scoredPlaces,
      total: scoredPlaces.length,
    })
  } catch (error) {
    console.error("Recs API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
