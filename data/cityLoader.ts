import fs from "fs"
import path from "path"
import type { Place } from "@/types/place"

// Mapeo de nombres de ciudades
const CITY_NAME_MAPPING: Record<string, string> = {
  cdmx: "cdmx",
  "ciudad de méxico": "cdmx",
  df: "cdmx",
  "mexico city": "cdmx",
  monterrey: "monterrey",
  mty: "monterrey",
  guadalajara: "guadalajara",
  gdl: "guadalajara",
  "san miguel de allende": "san-miguel-de-allende",
  sma: "san-miguel-de-allende",
  "ciudad victoria": "ciudad-victoria",
  victoria: "ciudad-victoria",
  tijuana: "tijuana",
  tj: "tijuana",
}

interface CityDataWrapper {
  city?: string
  places?: Place[]
}

type CityData = Place[] | CityDataWrapper

const placesCache = new Map<string, Place[]>()

export async function getPlacesByCity(cityInput: string): Promise<Place[]> {
  try {
    const normalizedCity = normalizeCityName(cityInput)
    if (placesCache.has(normalizedCity)) {
      return placesCache.get(normalizedCity)!
    }

    const filePath = path.join(process.cwd(), "data", "cities", `${normalizedCity}.json`)

    if (!fs.existsSync(filePath)) {
      console.warn(`City file not found: ${filePath}`)
      return []
    }

    const fileContent = fs.readFileSync(filePath, "utf8")
    const cityData: CityData = JSON.parse(fileContent)

    // FIX: Manejar ambas estructuras correctamente
    let places: Place[]
    if (Array.isArray(cityData)) {
      // Estructura directa: [Place, Place, ...]
      places = cityData
    } else if (cityData.places && Array.isArray(cityData.places)) {
      // Estructura wrapped: { city: "CDMX", places: [...] }
      places = cityData.places
    } else {
      console.error("Invalid city data structure:", typeof cityData)
      return []
    }

    // Validar y limpiar datos
    const validPlaces = places
      .filter((place) => place && place.id && place.name)
      .map((place) => ({
        ...place,
        // Normalizar playlists
        playlists: Array.isArray(place.playlists) ? place.playlists : [],
        // Asegurar campos requeridos
        category: place.category || "Restaurante",
        rating: place.rating || 0,
        location: place.location || "",
      }))

    placesCache.set(normalizedCity, validPlaces)
    console.log(`Loaded ${validPlaces.length} places for ${normalizedCity}`)
    return validPlaces
  } catch (error) {
    console.error(`Error loading places for ${cityInput}:`, error)
    return []
  }
}

export function normalizeCityName(cityName: string): string {
  const normalized = cityName.toLowerCase().trim()
  return CITY_NAME_MAPPING[normalized] || normalized
}

// Nueva función para debug
export function debugCityData(cityName: string) {
  const filePath = path.join(process.cwd(), "data", "cities", `${cityName}.json`)
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf8")
    const data = JSON.parse(content)
    console.log(`Debug ${cityName}:`, {
      isArray: Array.isArray(data),
      hasPlaces: !!data.places,
      length: Array.isArray(data) ? data.length : data.places?.length || 0,
      firstItem: Array.isArray(data) ? data[0] : data.places?.[0],
    })
  }
}
