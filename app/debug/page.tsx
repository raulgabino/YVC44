"use client"

import { useState, useEffect } from "react"

interface DebugInfo {
  city: string
  vibe: string
  totalPlaces: number
  filteredPlaces: number
  samplePlaylists: Array<{ name: string; playlists: string[] }>
  message?: string
  error?: string
}

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedCity, setSelectedCity] = useState("cdmx")
  const [selectedVibe, setSelectedVibe] = useState("")

  const cities = [
    { value: "cdmx", label: "CDMX" },
    { value: "guadalajara", label: "Guadalajara" },
    { value: "ciudad-victoria", label: "Ciudad Victoria" },
    { value: "monterrey", label: "Monterrey" },
    { value: "tijuana", label: "Tijuana" },
    { value: "san-miguel-de-allende", label: "San Miguel de Allende" },
  ]

  const vibes = [
    "traca",
    "bellaqueo",
    "tranqui",
    "godínez",
    "dominguero",
    "chambeador",
    "tóxico",
    "dateo",
    "crudo",
    "barbón",
    "aesthetic",
    "cultural",
    "nostálgico",
    "boho",
    "gourmet",
    "minimal",
  ]

  const testAPI = async () => {
    setLoading(true)
    try {
      const url = new URL("/api/places", window.location.origin)
      url.searchParams.set("city", selectedCity)
      if (selectedVibe) {
        url.searchParams.set("vibe", selectedVibe)
      }

      console.log("🔍 Testing API:", url.toString())

      const response = await fetch(url.toString())
      const data = await response.json()

      console.log("📊 API Response:", data)
      setDebugInfo(data.debug)
    } catch (error) {
      console.error("💥 API Test Error:", error)
      setDebugInfo({
        city: selectedCity,
        vibe: selectedVibe,
        totalPlaces: 0,
        filteredPlaces: 0,
        samplePlaylists: [],
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testAPI()
  }, [selectedCity, selectedVibe])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 Debug YourCityVibes</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">City:</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {cities.map((city) => (
                  <option key={city.value} value={city.value}>
                    {city.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Vibe (optional):</label>
              <select
                value={selectedVibe}
                onChange={(e) => setSelectedVibe(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">All vibes</option>
                {vibes.map((vibe) => (
                  <option key={vibe} value={vibe}>
                    {vibe}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={testAPI}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Testing..." : "Test API"}
          </button>
        </div>

        {debugInfo && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Results</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-semibold text-gray-700">Basic Info</h3>
                <p>
                  <strong>City:</strong> {debugInfo.city}
                </p>
                <p>
                  <strong>Vibe:</strong> {debugInfo.vibe || "None"}
                </p>
                <p>
                  <strong>Total Places:</strong> {debugInfo.totalPlaces}
                </p>
                <p>
                  <strong>Filtered Places:</strong> {debugInfo.filteredPlaces}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-semibold text-gray-700">Status</h3>
                {debugInfo.error ? (
                  <p className="text-red-600">
                    <strong>Error:</strong> {debugInfo.error}
                  </p>
                ) : debugInfo.totalPlaces === 0 ? (
                  <p className="text-yellow-600">
                    <strong>Warning:</strong> No places loaded
                  </p>
                ) : debugInfo.filteredPlaces === 0 && debugInfo.vibe ? (
                  <p className="text-yellow-600">
                    <strong>Warning:</strong> No places match vibe
                  </p>
                ) : (
                  <p className="text-green-600">
                    <strong>Success:</strong> Places loaded successfully
                  </p>
                )}
                {debugInfo.message && <p className="text-gray-600 mt-2">{debugInfo.message}</p>}
              </div>
            </div>

            {debugInfo.samplePlaylists && debugInfo.samplePlaylists.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-semibold text-gray-700 mb-3">Sample Places & Playlists</h3>
                <div className="space-y-2">
                  {debugInfo.samplePlaylists.map((place, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <p className="font-medium">{place.name}</p>
                      <p className="text-sm text-gray-600">Playlists: {place.playlists.join(", ") || "None"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
