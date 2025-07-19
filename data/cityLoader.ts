import type { Place } from "@/types/place"

const SUPPORTED_CITIES = ["cdmx", "ciudad-victoria", "monterrey", "san-miguel-de-allende", "guadalajara"] as const

type SupportedCity = (typeof SUPPORTED_CITIES)[number]

// Cache for loaded city data
const cityDataCache = new Map<string, Place[]>()

export async function loadCityData(cityName: string): Promise<Place[] | null> {
  const normalizedCity = normalizeCityName(cityName)
  if (!normalizedCity) {
    return null
  }

  // Check cache first
  if (cityDataCache.has(normalizedCity)) {
    return cityDataCache.get(normalizedCity)!
  }

  try {
    // Fetch city data at runtime (Edge-safe)
    const response = await fetch(`/data/cities/${normalizedCity}.json`)
    if (!response.ok) {
      console.warn(`No data found for city: ${cityName}`)
      return null
    }

    const cityData: Place[] = await response.json()
    // Cache the result
    cityDataCache.set(normalizedCity, cityData)
    return cityData
  } catch (error) {
    console.error(`Error loading data for city ${cityName}:`, error)
    return null
  }
}

function normalizeCityName(cityName: string): SupportedCity | null {
  const normalized = cityName.toLowerCase().trim()

  // City mappings for different variations
  const cityMappings: Record<string, SupportedCity> = {
    cdmx: "cdmx",
    "ciudad de méxico": "cdmx",
    "mexico city": "cdmx",
    df: "cdmx",
    "ciudad victoria": "ciudad-victoria",
    victoria: "ciudad-victoria",
    monterrey: "monterrey",
    mty: "monterrey",
    "san miguel de allende": "san-miguel-de-allende",
    "san miguel": "san-miguel-de-allende",
    guadalajara: "guadalajara",
    gdl: "guadalajara",
  }

  return cityMappings[normalized] || null
}

export function getSupportedCities(): readonly string[] {
  return SUPPORTED_CITIES
}

export function isCitySupported(cityName: string): boolean {
  return normalizeCityName(cityName) !== null
}
