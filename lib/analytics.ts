// Analytics helper for tracking usage patterns
export interface SearchAnalytics {
  vibe: string
  city: string
  timestamp: number
  results_count: number
  sources: string[]
  model_used?: string
  confidence?: string
}

export function logSearchAnalytics(data: SearchAnalytics) {
  // In a real app, this would send to analytics service
  console.log("📊 Search Analytics:", {
    ...data,
    date: new Date(data.timestamp).toISOString(),
  })

  // Store in localStorage for demo purposes
  if (typeof window !== "undefined") {
    const existing = JSON.parse(localStorage.getItem("ycv-analytics") || "[]")
    const updated = [data, ...existing].slice(0, 100) // Keep last 100 searches
    localStorage.setItem("ycv-analytics", JSON.stringify(updated))
  }
}

export function getSearchAnalytics(): SearchAnalytics[] {
  if (typeof window === "undefined") return []
  return JSON.parse(localStorage.getItem("ycv-analytics") || "[]")
}

export function generateAnalyticsReport() {
  const data = getSearchAnalytics()

  return {
    total_searches: data.length,
    popular_vibes: data.reduce(
      (acc, search) => {
        acc[search.vibe] = (acc[search.vibe] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
    popular_cities: data.reduce(
      (acc, search) => {
        acc[search.city] = (acc[search.city] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
    model_usage: data.reduce(
      (acc, search) => {
        if (search.model_used) {
          acc[search.model_used] = (acc[search.model_used] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    ),
    average_results: data.reduce((sum, search) => sum + search.results_count, 0) / data.length || 0,
  }
}
