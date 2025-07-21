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
      },
      { status: 400 },
    )
  }

  if (!isCitySupported(city)) {
    return NextResponse.json(
      {
        error: "Ciudad no soportada",
        message: `Aún no tenemos datos para ${city}. Ciudades disponibles: CDMX, Monterrey, Guadalajara, San Miguel de Allende, Ciudad Victoria, Tijuana`,
        code: "CITY_NOT_SUPPORTED",
      },
      { status: 404 },
    )
  }

  try {
    const cityPlaces = await loadCityData(city)

    if (!cityPlaces || cityPlaces.length === 0) {
      return NextResponse.json(
        {
          error: "Sin datos",
          message: `No se encontraron lugares para ${city}`,
          code: "NO_DATA",
        },
        { status: 404 },
      )
    }

    let filteredPlaces = cityPlaces

    // Filter by vibe if provided
    if (vibe && vibe !== "undefined") {
      filteredPlaces = cityPlaces.filter((place) =>
        place.playlists.some((playlist) => playlist.toLowerCase().includes(vibe.toLowerCase())),
      )

      // If no exact matches, return all places from the city
      if (filteredPlaces.length === 0) {
        filteredPlaces = cityPlaces
      }
    }

    return NextResponse.json({
      places: filteredPlaces,
      total: filteredPlaces.length,
      city: city,
      vibe: vibe || "all",
    })
  } catch (error) {
    console.error("Error loading city data:", error)
    return NextResponse.json(
      {
        error: "Error interno",
        message: "Error al cargar datos de la ciudad",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    )
  }
}
