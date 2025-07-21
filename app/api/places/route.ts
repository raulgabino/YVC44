import { type NextRequest, NextResponse } from "next/server"
import { loadCityData, isCitySupported } from "@/data/cityLoader"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const vibe = searchParams.get("vibe")
  const city = searchParams.get("city")

  if (!city || city === "unknown") {
    return NextResponse.json(
      {
        error: "Ciudad requerida",
        message: "Por favor especifica una ciudad para buscar lugares",
        code: "CITY_REQUIRED",
        availableCities: "CDMX, Monterrey, Guadalajara, San Miguel de Allende, Ciudad Victoria, Tijuana",
      },
      { status: 400 },
    )
  }

  if (!isCitySupported(city)) {
    return NextResponse.json(
      {
        error: "Ciudad no soportada",
        message: `La ciudad "${city}" no está disponible actualmente`,
        code: "CITY_NOT_SUPPORTED",
        availableCities: "CDMX, Monterrey, Guadalajara, San Miguel de Allende, Ciudad Victoria, Tijuana",
      },
      { status: 400 },
    )
  }

  try {
    const places = await loadCityData(city)

    if (!places || places.length === 0) {
      return NextResponse.json(
        {
          error: "Sin datos",
          message: `No se encontraron lugares para ${city}`,
          code: "NO_PLACES_FOUND",
        },
        { status: 404 },
      )
    }

    // Filter by vibe if provided
    let filteredPlaces = places
    if (vibe && vibe !== "unknown") {
      // Simple filtering by playlist match for now
      // TODO: Implement more sophisticated vibe matching
      filteredPlaces = places.filter((place) =>
        place.playlists.some(
          (playlist: string) =>
            playlist.toLowerCase().includes(vibe.toLowerCase()) || vibe.toLowerCase().includes(playlist.toLowerCase()),
        ),
      )

      // If no vibe matches, return all places
      if (filteredPlaces.length === 0) {
        filteredPlaces = places
      }
    }

    return NextResponse.json({
      city,
      vibe: vibe || "all",
      places: filteredPlaces,
      total: filteredPlaces.length,
      source: "city_data",
    })
  } catch (error) {
    console.error("Error loading city data:", error)
    return NextResponse.json(
      {
        error: "Error interno",
        message: "Error al cargar los datos de la ciudad",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    )
  }
}
