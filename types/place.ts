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
  city: string
  phone?: string
  hours?: string
  lat?: number
  lng?: number
  rating?: number // 1 decimal
  price_range?: "$" | "$$" | "$$$"
  description_short: string
  playlists: string[] // 0‑5 vibes
  source: "local" | "web" | "gpt"
  place_id?: string
}

export type PlaceHours = {
  monday?: string
  tuesday?: string
  wednesday?: string
  thursday?: string
  friday?: string
  saturday?: string
  sunday?: string
}
