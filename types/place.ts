export type Place = {
  id: number
  name: string
  category:
    | "Restaurante"
    | "Café"
    | "Bar y Cantina"
    | "Boutique"
    | "Espacio Cultural"
    | "Salón de Belleza"
    | "Librería con Encanto"
  address: string
  city: string // Cambiar de union type limitado a string libre
  phone?: string
  hours?: string // Cambiar de PlaceHours a string opcional
  description_short: string
  playlists: string[]
  source: "local" | "web" | "gpt"
}

// Mantener PlaceHours para compatibilidad pero hacer opcional su uso
export interface PlaceHours {
  monday: string
  tuesday: string
  wednesday: string
  thursday: string
  friday: string
  saturday: string
  sunday: string
}
