// Solución mejorada para app/api/search/route.ts
// Sistema de perfiles de vibe con contexto específico y validaciones estrictas
import { type NextRequest, NextResponse } from "next/server"
import type { Place } from "@/types/place"

export async function POST(request: NextRequest) {
  try {
    const { vibe, city } = await request.json()
    console.log("🔍 GPT Expanded search request:", { vibe, city })

    if (!vibe || !city) {
      return NextResponse.json([])
    }

    if (!process.env.OPENAI_API_KEY) {
      console.log("⚠️ OPENAI_API_KEY not configured")
      return NextResponse.json([])
    }

    // Determinar si la ciudad es mexicana o internacional
    const isMexicanCity = await checkIfMexicanCity(city)

    console.log("🇲🇽 City analysis:", { city, isMexicanCity })

    // Sistema de perfiles de vibe con contexto específico
    const vibeProfiles: Record<
      string,
      {
        description: string
        context: string
        avoid: string
        examples: string
      }
    > = {
      Traka: {
        description: "fiesta, diversión, vida nocturna, música en vivo, antros",
        context: "lugares para reventón, ambiente de club, música alta",
        avoid: "lugares familiares, formales, tranquilos",
        examples: "antros, bares con música, terrazas de fiesta",
      },
      Bellakeo: {
        description: "ambiente seductor, sensual, para ligar, cocktails sofisticados",
        context: "lugares íntimos pero con ambiente sensual, no familiar",
        avoid: "lugares familiares, casuales, muy formales",
        examples: "bares de cocktails, terrazas con ambiente, lounges",
      },
      Tranqui: {
        description: "relajado, sin presión, chill, ambiente zen, terrazas",
        context: "lugares para descansar, conversar tranquilo, sin prisa",
        avoid: "lugares muy formales, de fiesta, ruidosos",
        examples: "cafés con terraza, parques, lugares chill",
      },
      Godínez: {
        description: "profesional, formal, ejecutivo, wifi, cerca de oficinas",
        context: "lugares para reuniones de trabajo, después de oficina",
        avoid: "lugares muy casuales, de fiesta, familiares",
        examples: "restaurantes ejecutivos, cafés con wifi, lugares formales",
      },
      Dominguero: {
        description: "familiar, casual, para fines de semana, brunch, niños",
        context: "lugares para familias, ambiente hogareño, relajado",
        avoid: "lugares de fiesta, muy formales, nocturnos",
        examples: "restaurantes familiares, parques, lugares de brunch",
      },
      Chambeador: {
        description: "para trabajar, estudiar, wifi confiable, silencioso",
        context: "lugares productivos, con mesas amplias, enchufes",
        avoid: "lugares ruidosos, de fiesta, sin wifi",
        examples: "cafés para laptop, bibliotecas, coworking",
      },
      Tóxico: {
        description: "intenso, dramático, para procesar emociones, mezcal",
        context: "lugares para desahogarse, ambiente introspectivo",
        avoid: "lugares muy alegres, familiares, formales",
        examples: "bares oscuros, cantinas, lugares con mezcal",
      },
      Dateo: {
        description: "romántico, para citas, íntimo, elegante, velas",
        context: "lugares para parejas, ambiente romántico pero no familiar",
        avoid: "lugares muy casuales, ruidosos, familiares",
        examples: "restaurantes románticos, cafés íntimos, terrazas con vista",
      },
      Crudo: {
        description: "lugares CASUALES para resaca, fondas populares, tacos, caldos",
        context: "lugares SIN PRETENSIONES, baratos, tradicionales, comfort food",
        avoid: "lugares trendy, caros, instagrameables, upscale como Rosetta",
        examples: "taquerías de barrio, fondas familiares, jugos Betty, comedores populares",
      },
      Barbón: {
        description: "sofisticado, elegante, exclusivo, premium, vinos",
        context: "lugares caros, con clase, para impresionar",
        avoid: "lugares casuales, baratos, populares",
        examples: "restaurantes premium, wine bars, lugares exclusivos",
      },
      Instagrameable: {
        description: "trendy, fotogénico, viral, aesthetic, para fotos",
        context: "lugares modernos, con diseño llamativo, populares en redes",
        avoid: "lugares muy tradicionales, sin diseño especial",
        examples: "cafés aesthetic, restaurantes con diseño, lugares trendy",
      },
    }

    const vibeProfile = vibeProfiles[vibe]
    if (!vibeProfile) {
      return NextResponse.json(getFallbackResults(city, vibe))
    }

    // Prompt adaptado según si es México o internacional
    const searchPrompt = isMexicanCity
      ? buildMexicanCityPrompt(city, vibe, vibeProfile)
      : buildInternationalCityPrompt(city, vibe, vibeProfile.description)

    console.log("🚀 Sending to GPT with adapted prompt...")

    const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Eres un experto en recomendaciones de lugares que entiende perfectamente la cultura y jerga mexicana.
                     
            Para ciudades mexicanas: Recomienda lugares específicos solo si los conoces bien.
            Para ciudades internacionales: Enfócate en TIPOS de lugares que encajen con la vibe mexicana, pero sé honesto sobre limitaciones de conocimiento específico.
                        
            SIEMPRE responde con JSON válido. Si no puedes recomendar lugares específicos, devuelve array vacío: []`,
          },
          { role: "user", content: searchPrompt },
        ],
        temperature: 0.2, // Más conservador
        max_tokens: 1000,
      }),
    })

    if (!gptResponse.ok) {
      console.error("❌ GPT API error:", gptResponse.status)
      return NextResponse.json([])
    }

    const data = await gptResponse.json()
    const content = data.choices[0]?.message?.content

    console.log("📥 GPT response received:", {
      hasContent: !!content,
      contentLength: content?.length || 0,
    })

    if (!content) {
      return NextResponse.json([])
    }

    let placesData: any[] = []
    try {
      // Limpiar y parsear respuesta
      const cleanContent = content.trim()
      placesData = JSON.parse(cleanContent)

      if (!Array.isArray(placesData)) {
        console.log("⚠️ Response is not an array, returning empty")
        return NextResponse.json([])
      }

      console.log("✅ Successfully parsed:", placesData.length, "places")
    } catch (parseError) {
      console.error("❌ Error parsing GPT response:", parseError)
      console.log("📄 Raw content:", content.substring(0, 300))
      return NextResponse.json([])
    }

    // Formatear resultados
    const formattedPlaces: Place[] = placesData
      .slice(0, 3)
      .filter((place) => place && typeof place === "object" && place.name)
      .map((place, index) => ({
        id: 6000 + index,
        name: place.name?.trim() || `Lugar en ${city}`,
        category: mapCategory(place.category) || "Restaurante",
        address: place.address?.trim() || `${city}`,
        city: city,
        description_short:
          place.description_short?.trim().substring(0, 150) || `Un lugar perfecto para ${vibe.toLowerCase()}.`,
        playlists: [vibe],
        source: "gpt" as const,
        phone: place.phone || "No disponible",
        hours: place.hours || createDefaultHours(),
      }))

    console.log("🎯 Returning formatted places:", {
      count: formattedPlaces.length,
      city: city,
      vibe: vibe,
    })

    return NextResponse.json(formattedPlaces)
  } catch (error) {
    console.error("💥 Error in GPT expanded search:", error)
    return NextResponse.json([])
  }
}

async function checkIfMexicanCity(city: string): Promise<boolean> {
  // Lista extendida de ciudades/términos mexicanos
  const mexicanCities = [
    // Principales
    "cdmx",
    "ciudad de méxico",
    "df",
    "guadalajara",
    "gdl",
    "monterrey",
    "mty",
    // Medianas
    "puebla",
    "tijuana",
    "león",
    "juárez",
    "ciudad juárez",
    "torreón",
    "querétaro",
    "culiacán",
    "mexicali",
    "aguascalientes",
    "mérida",
    "saltillo",
    "hermosillo",
    // Turísticas
    "cancún",
    "puerto vallarta",
    "playa del carmen",
    "cozumel",
    "acapulco",
    "mazatlán",
    "los cabos",
    "oaxaca",
    "san miguel de allende",
    "tulum",
    // Fronterizas
    "nuevo laredo",
    "reynosa",
    "matamoros",
    "nogales",
    "ensenada",
    // Otras
    "toluca",
    "morelia",
    "xalapa",
    "veracruz",
    "campeche",
    "chetumal",
    "tuxtla",
  ]

  const cityLower = city.toLowerCase().trim()
  return mexicanCities.some((mexicanCity) => cityLower.includes(mexicanCity) || mexicanCity.includes(cityLower))
}

function buildMexicanCityPrompt(city: string, vibe: string, vibeProfile: any): string {
  return `Eres un experto local en ${city}, México. Busca lugares que REALMENTE encajen con este vibe específico:

VIBE: ${vibe}
CONTEXTO: ${vibeProfile.context}
DESCRIPCIÓN: ${vibeProfile.description}
EVITAR ABSOLUTAMENTE: ${vibeProfile.avoid}
EJEMPLOS CORRECTOS: ${vibeProfile.examples}

INSTRUCCIONES ESPECÍFICAS PARA "${vibe}":
${
  vibe === "Crudo"
    ? `
- PROHIBIDO recomendar: Panadería Rosetta, cafés trendy, lugares caros
- SOLO lugares casuales: taquerías, fondas, comedores populares
- Precios accesibles, ambiente sin pretensiones
- Lugares donde puedas llegar "hecho pedazos" sin problemas
`
    : vibe === "Barbón"
      ? `
- SOLO lugares caros, exclusivos, sofisticados
- Ambiente premium, servicio de primera
- Para impresionar, no para uso cotidiano
`
      : vibe === "Instagrameable"
        ? `
- SOLO lugares trendy, modernos, fotogénicos
- Con diseño llamativo, populares en redes sociales
- Aesthetic importante, viral-worthy
`
        : `
- Enfócate en ${vibeProfile.context}
- Evita ${vibeProfile.avoid}
`
}

Encuentra máximo 3 lugares REALES en ${city} que estén operando en 2024 y que coincidan EXACTAMENTE con el contexto del vibe.

IMPORTANTE: Si es ${vibe}, NO incluyas Panadería Rosetta ni lugares similares.

Formato JSON requerido:
[
  {
    "name": "Nombre exacto del lugar",
    "category": "Restaurante|Café|Bar y Cantina|Boutique|Espacio Cultural|Salón de Belleza|Librería con Encanto",
    "address": "Dirección completa con colonia",
    "description_short": "Por qué encaja ESPECÍFICAMENTE con ${vibe} - máximo 100 caracteres"
  }
]`
}

function buildInternationalCityPrompt(city: string, vibe: string, vibeDescription: string): string {
  return `La búsqueda es para "${vibe}" en ${city}. Esta es una vibe mexicana que significa: "${vibeDescription}".

CONTEXTO CULTURAL:
- El usuario busca lugares que encajen con la mentalidad/cultura mexicana de "${vibe}"
- Necesitas recomendar TIPOS de lugares que un mexicano buscaría para esta vibe

INSTRUCCIONES:
- Si conoces lugares específicos en ${city} que encajen, menciónalos
- Si NO conoces lugares específicos, responde con array vacío: []
- NO inventes lugares o nombres específicos
- Enfócate en la experiencia/ambiente que busca un mexicano

SOLO si conoces lugares específicos, usa este formato JSON:
[
  {
    "name": "Nombre exacto verificable",
    "category": "Restaurante|Café|Bar y Cantina|Boutique|Espacio Cultural",
    "address": "Dirección en ${city}",
    "description_short": "Por qué un mexicano lo disfrutaría para ${vibe}"
  }
]

Si tienes dudas sobre lugares específicos, responde: []`
}

function getFallbackResults(city: string, vibe: string): Place[] {
  // Fallback results cuando no se encuentra el vibe
  return []
}

function createDefaultHours() {
  return {
    monday: "No disponible",
    tuesday: "No disponible",
    wednesday: "No disponible",
    thursday: "No disponible",
    friday: "No disponible",
    saturday: "No disponible",
    sunday: "No disponible",
  }
}

function mapCategory(category: string): Place["category"] {
  if (!category || typeof category !== "string") {
    return "Restaurante"
  }

  const categoryMap: Record<string, Place["category"]> = {
    restaurante: "Restaurante",
    restaurant: "Restaurante",
    café: "Café",
    cafe: "Café",
    bar: "Bar y Cantina",
    cantina: "Bar y Cantina",
    boutique: "Boutique",
    tienda: "Boutique",
    galería: "Espacio Cultural",
    museo: "Espacio Cultural",
    "espacio cultural": "Espacio Cultural",
    librería: "Librería con Encanto",
    salón: "Salón de Belleza",
  }

  const normalized = category.toLowerCase().trim()

  for (const [key, value] of Object.entries(categoryMap)) {
    if (normalized.includes(key)) {
      return value
    }
  }

  return "Restaurante"
}
