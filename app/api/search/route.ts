// Solución simplificada para app/api/search/route.ts
// GPT Expandido que entiende cuando debe buscar vs cuando debe fallar
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

    const vibeDescriptions: Record<string, string> = {
      Traka: "fiesta intensa, reventón, antros, vida nocturna vibrante, música en vivo",
      Bellakeo: "ambiente seductor, sensual, para ligar, romántico pero intenso, cocktails sofisticados",
      Tranqui: "relajado, tranquilo, sin presión, chill, ambiente zen, terrazas acogedoras",
      Godínez: "profesional, formal, para después del trabajo, ejecutivo, wifi confiable",
      Dominguero: "familiar, casual, para fines de semana, ambiente hogareño, brunch, pet-friendly",
      Chambeador: "para trabajar, estudiar, productivo, wifi excelente, silencioso, enchufes",
      Tóxico: "intenso, dramático, para procesar emociones, catártico, ambiente introspectivo",
      Dateo: "romántico, para citas, íntimo, elegante, velas, música suave",
      Crudo: "para la resaca, comfort food, recovery, desayunos curativos, jugos naturales",
      Barbón: "sofisticado, elegante, con clase, exclusivo, premium, carta de vinos selecta",
    }

    const vibeDescription = vibeDescriptions[vibe] || vibe.toLowerCase()

    // Prompt adaptado según si es México o internacional
    const searchPrompt = isMexicanCity
      ? buildMexicanCityPrompt(city, vibe, vibeDescription)
      : buildInternationalCityPrompt(city, vibe, vibeDescription)

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

function buildMexicanCityPrompt(city: string, vibe: string, vibeDescription: string): string {
  return `Busca 3 lugares REALES y específicos en ${city}, México que encajen perfectamente con "${vibeDescription}".

CRITERIOS MEXICANOS:
- Solo lugares que REALMENTE existen en ${city}, México
- Que entiendan la vibe "${vibe}" en el contexto cultural mexicano
- Preferir lugares populares entre locales, no solo turísticos
- Categorías: restaurantes, cafés, bares, cantinas, boutiques, espacios culturales

IMPORTANTE: 
- Si NO conoces lugares específicos en ${city}, responde: []
- NO inventes nombres o direcciones
- Es mejor no responder que dar información incorrecta

FORMATO JSON:
[
  {
    "name": "Nombre exacto del lugar",
    "category": "Restaurante|Café|Bar y Cantina|Boutique|Espacio Cultural|Librería con Encanto|Salón de Belleza",
    "address": "Dirección completa en ${city}, México",
    "description_short": "Por qué es perfecto para ${vibe} (máx 120 caracteres)",
    "phone": "+52 xxx xxx xxxx (solo si estás seguro)",
    "hours": {
      "monday": "HH:MM-HH:MM o Cerrado",
      "tuesday": "HH:MM-HH:MM o Cerrado",
      "wednesday": "HH:MM-HH:MM o Cerrado",
      "thursday": "HH:MM-HH:MM o Cerrado",
      "friday": "HH:MM-HH:MM o Cerrado",
      "saturday": "HH:MM-HH:MM o Cerrado",
      "sunday": "HH:MM-HH:MM o Cerrado"
    }
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
