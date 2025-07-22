"use client"

import { useState } from "react"
import { ChevronDown, MapPin } from "lucide-react"

interface CitySelectorProps {
  selectedCity: string
  onCitySelect: (city: string) => void
}

const cities = [
  { id: "cdmx", name: "Ciudad de México", short: "CDMX" },
  { id: "monterrey", name: "Monterrey", short: "MTY" },
  { id: "guadalajara", name: "Guadalajara", short: "GDL" },
  { id: "san-miguel-de-allende", name: "San Miguel de Allende", short: "SMA" },
  { id: "ciudad-victoria", name: "Ciudad Victoria", short: "VIC" },
  { id: "tijuana", name: "Tijuana", short: "TIJ" },
]

export default function CitySelector({ selectedCity, onCitySelect }: CitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedCityData = cities.find((c) => c.id === selectedCity) || cities[0]

  const handleCitySelect = (cityId: string) => {
    onCitySelect(cityId)
    setIsOpen(false)
  }

  return (
    <div className="relative mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Seleccionar ciudad"
        className="flex items-center justify-between w-full max-w-xs mx-auto px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-white hover:bg-white/15 transition-all duration-200"
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-green-400" />
          <span className="font-medium">{selectedCityData.name}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-black/90 backdrop-blur-sm rounded-xl border border-white/20 shadow-xl z-50">
          <div className="p-2">
            {cities.map((city) => (
              <button
                key={city.id}
                onClick={() => handleCitySelect(city.id)}
                className={`
                  w-full text-left px-3 py-2 rounded-lg transition-colors duration-150
                  ${
                    selectedCity === city.id
                      ? "bg-green-500/20 text-green-300 font-semibold"
                      : "text-gray-200 hover:bg-white/10"
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span>{city.name}</span>
                  <span className="text-sm text-gray-400">{city.short}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
