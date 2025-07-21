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
  rating?: number
  price_range?: "$" | "$$" | "$$$"
  description_short: string
  playlists: string[]
  source: "local" | "web" | "gpt"
  place_id?: string
}
