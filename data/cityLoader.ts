// City data loader with caching and validation
const SUPPORTED_CITIES = [
  "cdmx",
  "ciudad-victoria",
  "monterrey",
  "san-miguel-de-allende",
  "guadalajara",
  "tijuana",
] as const

type SupportedCity = (typeof SUPPORTED_CITIES)[number]

// City name mappings for flexible input
const CITY_MAPPINGS: Record<string, SupportedCity> = {
  // CDMX variations
  cdmx: "cdmx",
  "ciudad de mexico": "cdmx",
  "ciudad de méxico": "cdmx",
  "mexico city": "cdmx",
  df: "cdmx",
  "distrito federal": "cdmx",

  // Monterrey variations
  monterrey: "monterrey",
  mty: "monterrey",

  // Guadalajara variations
  guadalajara: "guadalajara",
  gdl: "guadalajara",

  // San Miguel de Allende variations
  "san miguel de allende": "san-miguel-de-allende",
  "san miguel": "san-miguel-de-allende",

  // Ciudad Victoria variations
  "ciudad victoria": "ciudad-victoria",
  victoria: "ciudad-victoria",

  // Tijuana variations
  tijuana: "tijuana",
  tj: "tijuana",
}

// Cache for loaded city data
const cityDataCache = new Map<SupportedCity, any[]>()

/**
 * Normalizes city name to supported format
 */
export function normalizeCityName(cityName: string): SupportedCity | null {
  const normalized = cityName.toLowerCase().trim()
  return CITY_MAPPINGS[normalized] || null
}

/**
 * Checks if a city is supported
 */
export function isCitySupported(cityName: string): boolean {
  return normalizeCityName(cityName) !== null
}

/**
 * Gets list of all supported cities
 */
export function getSupportedCities(): readonly SupportedCity[] {
  return SUPPORTED_CITIES
}

/**
 * Loads city data with caching
 */
export async function loadCityData(cityName: string): Promise<any[] | null> {
  const normalizedCity = normalizeCityName(cityName)

  if (!normalizedCity) {
    return null
  }

  // Check cache first
  if (cityDataCache.has(normalizedCity)) {
    return cityDataCache.get(normalizedCity)!
  }

  try {
    // Dynamic import of city data
    const cityData = await import(`./cities/${normalizedCity}.json`)
    const places = cityData.default || cityData

    // Cache the result
    cityDataCache.set(normalizedCity, places)

    return places
  } catch (error) {
    console.error(`Failed to load data for city: ${normalizedCity}`, error)
    return null
  }
}

/**
 * Clears the city data cache (useful for testing)
 */
export function clearCityCache(): void {
  cityDataCache.clear()
}
