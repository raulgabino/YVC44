import { type NextRequest, NextResponse } from "next/server"
import { getPlacesByCity } from "@/data/cityLoader"
import type { Place } from "@/types/place"

// Mapeo de vibes canónicos a variaciones
const VIBE_VARIATIONS: Record<string, string[]> = {
  traca: ["traca", "fiesta", "party", "reventón"],
  bellaqueo: ["bellaqueo", "seducir", "ligar", "sensual"],
  tranqui: ["tranqui", "relajado", "chill", "zen"],
  godínez: ["godínez", "profesional", "trabajo", "oficina"],
  dominguero: ["dominguero", "familiar", "familia", "casual"],
  chambeador: ["chambeador", "productivo", "trabajar", "estudiar"],
  tóxico: ["tóxico", "dramático", "intenso", "emocional"],
  dateo: ["dateo", "romántico", "romanticón", "cita"],
  crudo: ["crudo", "resaca", "recovery", "hangover"],
  barbón: ["barbón", "sofisticado", "elegante", "premium"],
  aesthetic: ["aesthetic", "instagrameable", "fotogénico", "trendy"],
  cultural: ["cultural", "arte", "museo", "historia"],
  nostálgico: ["nostálgico", "vintage", "retro", "clásico"],
  boho: ["boho", "bohemio", "artístico", "alternativo"],
  gourmet: ["gourmet", "alta cocina", "chef", "fine dining"],
  minimal: ["minimal", "minimalista", "simple", "clean"],
}

function normalizeVibe(vibe: string): string {
  const normalized = vibe.toLowerCase().trim()

  // Buscar en las variaciones
  for (const [canonical, variations] of Object.entries(VIBE_VARIATIONS)) {
    if (variations.includes(normalized)) {
      return canonical
    }
  }

  return normalized
}

function filterPlacesByVibe(places: Place[], vibe: string): Place[] {
  if (!vibe || vibe.trim() === "") {
    console.log("🔍 No vibe filter, returning all places")
    return places
  }

  const normalizedVibe = normalizeVibe(vibe)
  console.log(`🎵 Filtering by vibe: ${vibe} -> ${normalizedVibe}`)

  const filtered = places.filter((place) => {
    if (!place.playlists || !Array.isArray(place.playlists)) {
      console.log(`⚠️ Place ${place.name} has no playlists`)
      return false
    }

    // Normalizar playlists del lugar
    const normalizedPlaylists = place.playlists.map((p) => normalizeVibe(p))
    const matches = normalizedPlaylists.includes(normalizedVibe)

    if (matches) {
      console.log(`✅ ${place.name} matches vibe ${normalizedVibe}:`, place.playlists)
    }

    return matches
  })

  console.log(`🎯 Filtered ${filtered.length} places from ${places.length} total`)
  return filtered
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get("city") || "cdmx"
    const vibe = searchParams.get("vibe") || ""

    console.log(`🔍 API Request - City: ${city}, Vibe: ${vibe}`)

    // Cargar lugares de la ciudad
    const allPlaces = await getPlacesByCity(city)
    console.log(`📍 Loaded ${allPlaces.length} places for ${city}`)

    if (allPlaces.length === 0) {
      console.log(`❌ No places found for city: ${city}`)
      return NextResponse.json({
        places: [],
        debug: {
          city,
          vibe,
          totalPlaces: 0,
          filteredPlaces: 0,
          message: `No places found for city: ${city}`,
        },
      })
    }

    // Filtrar por vibe si se proporciona
    const filteredPlaces = vibe ? filterPlacesByVibe(allPlaces, vibe) : allPlaces

    console.log(`🎯 Final result: ${filteredPlaces.length} places`)

    return NextResponse.json({
      places: filteredPlaces,
      debug: {
        city,
        vibe,
        normalizedVibe: vibe ? normalizeVibe(vibe) : null,
        totalPlaces: allPlaces.length,
        filteredPlaces: filteredPlaces.length,
        samplePlaylists: allPlaces.slice(0, 5).map((p) => ({
          name: p.name,
          playlists: p.playlists,
        })),
      },
    })
  } catch (error) {
    console.error("💥 Error in places API:", error)
    return NextResponse.json(
      {
        places: [],
        debug: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 },
    )
  }
}
