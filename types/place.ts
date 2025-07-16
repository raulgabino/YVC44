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
  city:
    | "CDMX"
    | "Monterrey"
    | "Guadalajara"
    | "Ciudad Victoria"
    | "San Miguel de Allende"
    | "Ciudad Juárez"
    | "Tijuana"
    | "León"
    | "Puebla"
    | "Mérida"
    | "Cancún"
    | "Nuevo Laredo"
  description_short: string
  playlists: string[]
  source: "local" | "web"
}
