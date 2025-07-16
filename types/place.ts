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
  city: "CDMX" | "Monterrey" | "Guadalajara"
  description_short: string
  playlists: string[]
  source: "local" | "web"
}
