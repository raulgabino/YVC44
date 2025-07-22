export interface VibeMapping {
  canonical: string // Nombre canónico
  frontend: string[] // Variaciones del frontend
  ai: string[] // Lo que detecta la IA
  json: string[] // Lo que está en los JSONs
  synonyms: string[] // Sinónimos y variaciones
}

export const VIBE_MAPPINGS: VibeMapping[] = [
  {
    canonical: "Bellakeo",
    frontend: ["Bellaquear", "Bellakeo"],
    ai: ["Bellakeo", "Bellaquear"],
    json: ["Bellaqueo", "bellakeo", "fiesta", "night-out", "seductor"],
    synonyms: ["ligar", "seducir", "sensual", "flirtear"],
  },
  {
    canonical: "Tranqui",
    frontend: ["Chill", "Tranqui"],
    ai: ["Tranqui", "Chill", "Relajado"],
    json: ["chill", "tranqui", "relajado", "peaceful"],
    synonyms: ["relax", "calma", "zen", "sereno"],
  },
  {
    canonical: "Romântico",
    frontend: ["Romanticón", "Romántico"],
    ai: ["Romántico", "Romanticón"],
    json: ["romanticón", "romántico", "noche-romántica", "romantic"],
    synonyms: ["amor", "pareja", "íntimo", "date"],
  },
  {
    canonical: "Productivo",
    frontend: ["Productivo", "Trabajo"],
    ai: ["Godínez", "Productivo", "Trabajo"],
    json: ["godínez", "chambeador", "trabajo", "productivo"],
    synonyms: ["oficina", "trabajo", "profesional", "business"],
  },
  {
    canonical: "Fiesta",
    frontend: ["Fiesta", "Party"],
    ai: ["Traka", "Fiesta", "Party"],
    json: ["traca", "fiesta", "party", "hype", "partyhard"],
    synonyms: ["diversión", "baile", "música", "celebrar"],
  },
  {
    canonical: "Gourmet",
    frontend: ["Gourmet", "Fine Dining"],
    ai: ["Gourmet", "Fino"],
    json: ["fine dining", "alta cocina", "gourmet", "elegante"],
    synonyms: ["refinado", "exclusivo", "premium", "sofisticado"],
  },
  {
    canonical: "Barbón",
    frontend: ["Barbón", "Fresa"],
    ai: ["Barbón", "Fresa", "Elegante"],
    json: ["barbón", "fresa", "elegante", "sofisticado"],
    synonyms: ["exclusivo", "premium", "fancy", "upscale"],
  },
  {
    canonical: "Cultural",
    frontend: ["Cultural", "Arte"],
    ai: ["Cultural", "Arte"],
    json: ["cultural", "arte", "aesthetic", "galería"],
    synonyms: ["museo", "exposición", "artístico", "creativo"],
  },
  {
    canonical: "Nostálgico",
    frontend: ["Nostálgico", "Vintage"],
    ai: ["Nostálgico", "Vintage", "Tradicional"],
    json: ["nostálgico", "tradicional", "vintage", "clásico"],
    synonyms: ["retro", "antiguo", "histórico", "tradicional"],
  },
  {
    canonical: "Familia",
    frontend: ["Familia", "Kids"],
    ai: ["Familia", "Niños", "Kids"],
    json: ["familia", "kids", "niños", "familiar"],
    synonyms: ["infantil", "padres", "children", "family-friendly"],
  },
]

// Función para encontrar vibe canónico desde cualquier input
export function findCanonicalVibe(input: string): string | null {
  const inputLower = input.toLowerCase().trim()
  for (const mapping of VIBE_MAPPINGS) {
    const allVariations = [
      ...mapping.frontend,
      ...mapping.ai,
      ...mapping.json,
      ...mapping.synonyms,
      mapping.canonical,
    ].map((v) => v.toLowerCase())

    if (allVariations.some((variation) => inputLower.includes(variation) || variation.includes(inputLower))) {
      return mapping.canonical
    }
  }
  return null
}

// Función para obtener todas las variaciones JSON de un vibe canónico
export function getJsonVariations(canonicalVibe: string): string[] {
  const mapping = VIBE_MAPPINGS.find((m) => m.canonical === canonicalVibe)
  return mapping ? [...mapping.json, ...mapping.synonyms] : []
}

// Función para mapear desde frontend a canónico
export function mapFrontendToCanonical(frontendVibe: string): string {
  return findCanonicalVibe(frontendVibe) || frontendVibe
}
