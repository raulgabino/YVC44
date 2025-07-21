export interface Place {
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
  phone?: string
  price_range?: string
  place_id?: string
  photoRef?: string
  source: string
}
