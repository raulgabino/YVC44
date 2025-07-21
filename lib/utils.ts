import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CATEGORY_MAPPINGS: Record<string, string> = {
  restaurant: "Restaurante",
  cafe: "Café",
  coffee: "Café",
  bar: "Bar y Cantina",
  club: "Antro",
  boutique: "Boutique",
  salon: "Salón de Belleza",
  cultural: "Espacio Cultural",
  bookstore: "Librería con Encanto",
}

export function mapCategory(category: string): string {
  const normalized = category.toLowerCase().trim()
  return CATEGORY_MAPPINGS[normalized] || "Restaurante"
}
