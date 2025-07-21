import { vibeCategory, DEFAULT_COMPATIBILITY } from "../../../packages/data/vibe_category_matrix"

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
}

interface UserCoords {
  lat: number
  lng: number
}

const WEIGHTS = {
  tokenAffinity: 0.4,
  categoryCompatibility: 0.25,
  distanceKm: 0.15,
  rating: 0.1,
  keywordMatch: 0.05,
  isOpen: 0.05,
}

const VIBE_TOKENS: Record<string, number> = {
  perreo: 0.9,
  reggaeton: 0.85,
  fiesta: 0.8,
  serenata: 0.37,
  romántico: 0.45,
  chill: 0.6,
  productivo: 0.7,
  café: 0.65,
  turista: 0.55,
  shopping: 0.5,
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function getTokenAffinity(description: string, playlists: string[], vibe: string): number {
  const text = `${description} ${playlists.join(" ")}`.toLowerCase()
  const vibeTokens = Object.keys(VIBE_TOKENS).filter(
    (token) => text.includes(token) || vibe.toLowerCase().includes(token),
  )

  if (vibeTokens.length === 0) return 0.2

  const maxWeight = Math.max(...vibeTokens.map((token) => VIBE_TOKENS[token]))
  return maxWeight
}

function getCategoryCompatibility(category: string, vibe: string): number {
  const vibeKey = vibe.toLowerCase()
  const matrix = vibeCategory[vibeKey]
  if (!matrix) return DEFAULT_COMPATIBILITY
  return matrix[category] || DEFAULT_COMPATIBILITY
}

function getDistanceScore(distance: number): number {
  if (distance >= 20) return 0
  return (20 - distance) / 20
}

function getRatingScore(rating?: number): number {
  if (!rating) return 0
  return rating / 5.0
}

function getKeywordMatch(text: string, vibe: string): number {
  const keywords = vibe.toLowerCase().split(" ")
  const matches = keywords.filter((keyword) => text.toLowerCase().includes(keyword)).length
  return matches / keywords.length
}

function isCurrentlyOpen(hours?: string): number {
  if (!hours) return 0.5
  const now = new Date()
  const currentHour = now.getHours()
  if (hours.includes("24") || hours.includes("siempre")) return 1
  if (currentHour >= 8 && currentHour <= 22) return 1
  return 0
}

export function scorePlace(place: Place, userVibe: string, userCoords: UserCoords | null): number {
  const text = `${place.description_short} ${place.playlists.join(" ")}`

  const tokenScore = getTokenAffinity(place.description_short, place.playlists, userVibe)
  const categoryScore = getCategoryCompatibility(place.category, userVibe)

  let distanceScore = 0
  if (userCoords && place.lat && place.lng) {
    const distance = calculateDistance(userCoords.lat, userCoords.lng, place.lat, place.lng)
    distanceScore = getDistanceScore(distance)
  }

  const ratingScore = getRatingScore(place.rating)
  const keywordScore = getKeywordMatch(text, userVibe)
  const openScore = isCurrentlyOpen(place.hours)

  const finalScore =
    tokenScore * WEIGHTS.tokenAffinity +
    categoryScore * WEIGHTS.categoryCompatibility +
    distanceScore * WEIGHTS.distanceKm +
    ratingScore * WEIGHTS.rating +
    keywordScore * WEIGHTS.keywordMatch +
    openScore * WEIGHTS.isOpen

  return Math.round(finalScore * 100) / 100
}
