import { type NextRequest, NextResponse } from "next/server"
import { placesData } from "@/data/places"
import type { Place } from "@/types/place"

interface PlacesRequest {
  vibe: string
  city: string
}

export async function POST(request: NextRequest) {
  try {
    const { vibe, city }: PlacesRequest = await request.json()

    console.log("🎯 Local places search:", { vibe, city })

    if (!vibe || !city) {
      console.log("❌ Missing vibe or city")
      return NextResponse.json([])
    }

    // Filter places by city and vibe
    const filteredPlaces = (placesData as Place[])
      .filter((place) => place.city === city)
      .filter((place) => place.playlists.includes(vibe as any))
      .map((place) => ({
        ...place,
        source: "local" as const,
      }))

    console.log(`✅ Found ${filteredPlaces.length} local places for ${vibe} in ${city}`)

    // Log analytics for popular combinations
    if (filteredPlaces.length > 0) {
      console.log("📊 Popular vibe-city combination:", {
        vibe,
        city,
        count: filteredPlaces.length,
        places: filteredPlaces.map((p) => p.name),
      })
    }

    return NextResponse.json(filteredPlaces)
  } catch (error) {
    console.error("💥 Error in local places search:", error)
    return NextResponse.json([])
  }
}

// GET endpoint for analytics and debugging
export async function GET() {
  try {
    const places = placesData as Place[]

    // Generate analytics
    const analytics = {
      total_places: places.length,
      by_city: places.reduce(
        (acc, place) => {
          acc[place.city] = (acc[place.city] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
      by_category: places.reduce(
        (acc, place) => {
          acc[place.category] = (acc[place.category] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
      by_vibe: places.reduce(
        (acc, place) => {
          place.playlists.forEach((vibe) => {
            acc[vibe] = (acc[vibe] || 0) + 1
          })
          return acc
        },
        {} as Record<string, number>,
      ),
      ciudad_victoria_coverage: {
        total: places.filter((p) => p.city === "Ciudad Victoria").length,
        by_category: places
          .filter((p) => p.city === "Ciudad Victoria")
          .reduce(
            (acc, place) => {
              acc[place.category] = (acc[place.category] || 0) + 1
              return acc
            },
            {} as Record<string, number>,
          ),
      },
    }

    return NextResponse.json({
      status: "success",
      message: "YCV Playlists Local Database Analytics",
      analytics,
      sample_places: places.slice(0, 5),
    })
  } catch (error) {
    console.error("Error generating analytics:", error)
    return NextResponse.json({ error: "Failed to generate analytics" }, { status: 500 })
  }
}
