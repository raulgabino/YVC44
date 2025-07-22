import { type NextRequest, NextResponse } from "next/server"
import { getPlacesByCity } from "@/data/cityLoader"
import { findCanonicalVibe, getJsonVariations } from "@/lib/vibeMapping"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vibe = searchParams.get("vibe")
    const city = searchParams.get("city") || "cdmx"

    console.log("API /places called with:", { vibe, city })

    const places = await getPlacesByCity(city)
    console.log(`Loaded ${places.length} total places for ${city}`)

    if (!vibe) {
      return NextResponse.json({ places: places.slice(0, 20) }) // Límite por performance
    }

    // NUEVO: Mapeo semántico inteligente
    const canonicalVibe = findCanonicalVibe(vibe)
    console.log(`Mapped vibe "${vibe}" to canonical "${canonicalVibe}"`)

    if (!canonicalVibe) {
      console.warn(`No mapping found for vibe: ${vibe}`)
      return NextResponse.json({ places: [] })
    }

    // Obtener todas las variaciones que podrían estar en los JSONs
    const jsonVariations = getJsonVariations(canonicalVibe)
    console.log(`Searching for variations:`, jsonVariations)

    // MEJORADO: Matching semántico en lugar de literal
    const filteredPlaces = places.filter((place) => {
      if (!place.playlists || !Array.isArray(place.playlists)) {
        return false
      }

      // Buscar match con cualquiera de las variaciones
      return place.playlists.some((playlist: string) => {
        const playlistLower = playlist.toLowerCase().trim()
        return jsonVariations.some((variation) => {
          const variationLower = variation.toLowerCase().trim()
          // Match exacto
          if (playlistLower === variationLower) return true
          // Match parcial bidireccional
          if (playlistLower.includes(variationLower) || variationLower.includes(playlistLower)) return true
          return false
        })
      })
    })

    console.log(`Found ${filteredPlaces.length} places matching "${canonicalVibe}"`)

    // Debug: mostrar algunos matches
    if (filteredPlaces.length > 0) {
      console.log(
        "Sample matches:",
        filteredPlaces.slice(0, 3).map((p) => ({
          name: p.name,
          playlists: p.playlists,
        })),
      )
    }

    return NextResponse.json({
      places: filteredPlaces,
      debug: {
        originalVibe: vibe,
        canonicalVibe,
        jsonVariations,
        totalPlaces: places.length,
        matchedPlaces: filteredPlaces.length,
      },
    })
  } catch (error) {
    console.error("Error in /api/places:", error)
    return NextResponse.json({ error: "Error fetching places", places: [] }, { status: 500 })
  }
}
