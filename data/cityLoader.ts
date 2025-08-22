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
  lugares?: Place[] // Para compatibilidad con estructura antigua
}

type CityData = Place[] | CityDataWrapper

const placesCache = new Map<string, Place[]>()

export async function getPlacesByCity(cityInput: string): Promise<Place[]> {
  try {
    const normalizedCity = normalizeCityName(cityInput)
    console.log(`🏙️ Loading places for city: ${cityInput} -> ${normalizedCity}`)

    if (placesCache.has(normalizedCity)) {
      const cached = placesCache.get(normalizedCity)!
      console.log(`📦 Using cached data: ${cached.length} places`)
      return cached
    }

    const filePath = path.join(process.cwd(), "data", "cities", `${normalizedCity}.json`)
    console.log(`📁 Looking for file: ${filePath}`)

    if (!fs.existsSync(filePath)) {
      console.error(`❌ City file not found: ${filePath}`)
      // Listar archivos disponibles para debug
      const citiesDir = path.join(process.cwd(), "data", "cities")
      if (fs.existsSync(citiesDir)) {
        const availableFiles = fs.readdirSync(citiesDir)
        console.log(`📂 Available city files:`, availableFiles)
      }
      return []
    }

    const fileContent = fs.readFileSync(filePath, "utf8")
    console.log(`📄 File content length: ${fileContent.length} characters`)

    let cityData: CityData
    try {
      cityData = JSON.parse(fileContent)
      console.log(`✅ JSON parsed successfully`)
    } catch (parseError) {
      console.error(`❌ JSON parse error:`, parseError)
      return []
    }

    // FIX: Manejar múltiples estructuras
    let places: Place[]
    if (Array.isArray(cityData)) {
      // Estructura directa: [Place, Place, ...]
      places = cityData
      console.log(`📋 Direct array structure: ${places.length} places`)
    } else if (cityData.places && Array.isArray(cityData.places)) {
      // Estructura wrapped: { places: [...] }
      places = cityData.places
      console.log(`📋 Wrapped structure (places): ${places.length} places`)
    } else if (cityData.lugares && Array.isArray(cityData.lugares)) {
      // Estructura wrapped: { lugares: [...] }
      places = cityData.lugares
      console.log(`📋 Wrapped structure (lugares): ${places.length} places`)
    } else {
      console.error("❌ Invalid city data structure:", {
        isArray: Array.isArray(cityData),
        hasPlaces: !!(cityData as any).places,
        hasLugares: !!(cityData as any).lugares,
        keys: Object.keys(cityData as any),
      })
      return []
    }

    // Validar y limpiar datos
    const validPlaces = places
      .filter((place, index) => {
        if (!place) {
          console.warn(`⚠️ Null place at index ${index}`)
          return false
        }
        if (!place.id) {
          console.warn(`⚠️ Place without ID at index ${index}:`, place.name || "unnamed")
          return false
        }
        if (!place.name) {
          console.warn(`⚠️ Place without name at index ${index}:`, place.id)
          return false
        }
        return true
      })
      .map((place) => ({
        ...place,
        // Normalizar playlists
        playlists: Array.isArray(place.playlists) ? place.playlists : [],
        // Asegurar campos requeridos
        category: place.category || "Restaurante",
        rating: place.rating || 0,
        address: place.address || "",
        city: place.city || cityInput,
        description_short: place.description_short || "",
      }))

    console.log(`✅ Processed ${validPlaces.length} valid places`)
    console.log(
      `🎵 Sample playlists:`,
      validPlaces.slice(0, 3).map((p) => ({ name: p.name, playlists: p.playlists })),
    )

    placesCache.set(normalizedCity, validPlaces)
    return validPlaces
  } catch (error) {
    console.error(`💥 Error loading places for ${cityInput}:`, error)
    return []
  }
}

export function normalizeCityName(cityName: string): string {
  const normalized = cityName.toLowerCase().trim()
  const mapped = CITY_NAME_MAPPING[normalized] || normalized
  console.log(`🗺️ City mapping: ${cityName} -> ${normalized} -> ${mapped}`)
  return mapped
}

// Nueva función para debug
export function debugCityData(cityName: string) {
  const normalizedCity = normalizeCityName(cityName)
  const filePath = path.join(process.cwd(), "data", "cities", `${normalizedCity}.json`)

  console.log(`🔍 Debug for ${cityName}:`)
  console.log(`📁 File path: ${filePath}`)
  console.log(`📂 File exists: ${fs.existsSync(filePath)}`)

  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, "utf8")
      const data = JSON.parse(content)
      console.log(`📊 Data structure:`, {
        isArray: Array.isArray(data),
        hasPlaces: !!data.places,
        hasLugares: !!data.lugares,
        length: Array.isArray(data) ? data.length : data.places?.length || data.lugares?.length || 0,
        firstItem: Array.isArray(data) ? data[0] : data.places?.[0] || data.lugares?.[0],
        keys: Array.isArray(data) ? ["array"] : Object.keys(data),
      })
    } catch (error) {
      console.error(`❌ Error reading/parsing file:`, error)
    }
  }
}
