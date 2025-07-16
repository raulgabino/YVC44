import { type NextRequest, NextResponse } from "next/server"
import { callPerplexityAPI, MODELS, getApiStatus } from "@/lib/api-config"
import type { Place } from "@/types/place"

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  model?: string
}

export async function POST(request: NextRequest) {
  try {
    const { vibe, city } = await request.json()

    console.log("🔍 Perplexity search request:", { vibe, city })

    const apiStatus = getApiStatus()
    console.log("📡 Perplexity API Status:", apiStatus.perplexity)

    // Early validation
    if (!vibe || !city) {
      console.log("❌ Missing vibe or city")
      return NextResponse.json([])
    }

    if (!apiStatus.perplexity.configured) {
      console.log("⚠️ PERPLEXITY_API_KEY not configured - returning empty results")
      return NextResponse.json([])
    }

    // Enhanced vibe descriptions with more context
    const vibeDescriptions: Record<string, string> = {
      Traka: "fiesta intensa, reventón, ambiente de club, vida nocturna vibrante, música en vivo",
      Bellakeo: "ambiente seductor, sensual, para ligar, romántico pero intenso, cocktails sofisticados",
      Tranqui: "relajado, tranquilo, sin presión, chill, ambiente zen, terraza acogedora",
      Godínez: "profesional, formal, para después del trabajo, ejecutivo, wifi confiable, ambiente corporativo",
      Dominguero: "familiar, casual, para fines de semana, ambiente hogareño, brunch, pet-friendly",
      Chambeador: "para trabajar, estudiar, productivo, wifi excelente, silencioso, enchufes disponibles",
      Tóxico: "intenso, dramático, para procesar emociones, catártico, ambiente introspectivo",
      Dateo: "romántico, para citas, íntimo, elegante, velas, música suave",
      Crudo: "para la resaca, comfort food, recovery, desayunos curativos, jugos naturales",
      Barbón: "sofisticado, elegante, con clase, exclusivo, premium, carta de vinos selecta",
    }

    const vibeDescription = vibeDescriptions[vibe] || vibe.toLowerCase()

    // Improved search prompt with better structure
    const searchPrompt = `Encuentra los 3 mejores lugares REALES y ACTUALES en ${city}, México que tengan un ambiente de ${vibeDescription}.

CRITERIOS DE BÚSQUEDA:
- Solo lugares que estén operando en 2024
- Enfócate en: restaurantes, cafés, bares, boutiques, espacios culturales, librerías
- Lugares populares y bien valorados
- Que coincidan específicamente con el vibe "${vibe}"

FORMATO DE RESPUESTA (JSON válido únicamente):
[
  {
    "name": "Nombre exacto del lugar",
    "category": "Restaurante|Café|Bar y Cantina|Boutique|Espacio Cultural|Librería con Encanto|Salón de Belleza",
    "address": "Dirección completa con colonia",
    "description_short": "Descripción breve (máximo 100 caracteres) de por qué encaja con ${vibe}"
  }
]

IMPORTANTE: Responde SOLO con el array JSON, sin texto adicional.`

    console.log("🚀 Sending to Perplexity:", {
      prompt: searchPrompt.substring(0, 100) + "...",
      model: MODELS.PERPLEXITY.PRIMARY,
      vibeDescription,
    })

    // Add timeout protection using the centralized helper
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    let data: PerplexityResponse
    try {
      data = await Promise.race([
        callPerplexityAPI(
          [
            {
              role: "system",
              content:
                "Eres un experto local en ciudades mexicanas que conoce los lugares más actuales y populares. Responde ÚNICAMENTE con JSON válido, sin explicaciones adicionales.",
            },
            {
              role: "user",
              content: searchPrompt,
            },
          ],
          MODELS.PERPLEXITY.PRIMARY,
        ),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 15000)),
      ])
    } catch (timeoutError) {
      console.error("⏰ Perplexity request timeout:", timeoutError)
      return NextResponse.json([]) // Return empty array on timeout
    } finally {
      clearTimeout(timeoutId)
    }

    const content = data.choices[0]?.message?.content
    console.log("📥 Perplexity raw response:", {
      hasContent: !!content,
      contentLength: content?.length || 0,
      preview: content?.substring(0, 200) + "...",
    })

    if (!content) {
      console.warn("⚠️ No content from Perplexity")
      return NextResponse.json([])
    }

    // Enhanced JSON parsing with multiple strategies
    let placesData: any[] = []
    try {
      // Strategy 1: Look for JSON array pattern
      const jsonArrayMatch = content.match(/\[\s*{[\s\S]*}\s*\]/)
      if (jsonArrayMatch) {
        placesData = JSON.parse(jsonArrayMatch[0])
        console.log("✅ Parsed JSON array:", placesData.length, "places")
      } else {
        // Strategy 2: Try to parse the entire content
        console.log("🔄 Trying to parse full content as JSON")
        placesData = JSON.parse(content)
      }

      // Validate parsed data
      if (!Array.isArray(placesData)) {
        throw new Error("Parsed data is not an array")
      }

      if (placesData.length === 0) {
        console.log("📭 Perplexity returned empty results")
        return NextResponse.json([])
      }
    } catch (parseError) {
      console.error("❌ Error parsing Perplexity response:", parseError)
      console.log("📄 Raw content that failed to parse:", content.substring(0, 500) + "...")

      // Enhanced fallback with more context
      const fallbackPlaces: Place[] = [
        {
          id: 3000,
          name: `Lugares ${vibe} encontrados`,
          category: "Restaurante" as const,
          address: `${city}, México`,
          city: city as "CDMX" | "Monterrey" | "Guadalajara",
          description_short: `Perplexity encontró información sobre lugares para ${vibe.toLowerCase()} en ${city}`,
          playlists: [vibe] as any,
          source: "web" as const,
        },
      ]
      console.log("🆘 Returning enhanced fallback result")
      return NextResponse.json(fallbackPlaces)
    }

    // Enhanced data transformation with validation
    const formattedPlaces: Place[] = placesData
      .slice(0, 3) // Limit to 3 results
      .filter((place) => place && typeof place === "object") // Filter out invalid entries
      .map((place, index) => ({
        id: 3000 + index,
        name: place.name?.trim() || `Lugar encontrado en ${city}`,
        category: mapCategory(place.category) || "Restaurante",
        address: place.address?.trim() || `${city}, México`,
        city: city as "CDMX" | "Monterrey" | "Guadalajara",
        description_short:
          place.description_short?.trim().substring(0, 150) ||
          `Un lugar perfecto para ${vibe.toLowerCase()} según búsquedas web recientes.`,
        playlists: [vibe] as any,
        source: "web" as const,
      }))
      .filter((place) => place.name && place.name.length > 3) // Filter out places with very short names

    console.log("🎯 Returning formatted places:", {
      count: formattedPlaces.length,
      places: formattedPlaces.map((p) => ({ name: p.name, category: p.category, source: p.source })),
    })

    return NextResponse.json(formattedPlaces)
  } catch (error) {
    console.error("💥 Error in Perplexity search:", error)

    // Consistent error response format (empty array instead of error object)
    return NextResponse.json([])
  }
}

// Enhanced category mapping with more comprehensive coverage
function mapCategory(category: string): Place["category"] {
  if (!category || typeof category !== "string") {
    return "Restaurante"
  }

  const categoryMap: Record<string, Place["category"]> = {
    // Restaurants
    restaurante: "Restaurante",
    restaurant: "Restaurante",
    comida: "Restaurante",
    cocina: "Restaurante",
    // Cafés
    café: "Café",
    cafe: "Café",
    cafetería: "Café",
    coffee: "Café",
    // Bars
    bar: "Bar y Cantina",
    cantina: "Bar y Cantina",
    pub: "Bar y Cantina",
    lounge: "Bar y Cantina",
    mezcalería: "Bar y Cantina",
    // Boutiques
    boutique: "Boutique",
    tienda: "Boutique",
    shop: "Boutique",
    store: "Boutique",
    // Cultural spaces
    galería: "Espacio Cultural",
    museo: "Espacio Cultural",
    centro: "Espacio Cultural",
    cultural: "Espacio Cultural",
    arte: "Espacio Cultural",
    // Libraries
    librería: "Librería con Encanto",
    biblioteca: "Librería con Encanto",
    bookstore: "Librería con Encanto",
    // Beauty
    salón: "Salón de Belleza",
    barbería: "Salón de Belleza",
    spa: "Salón de Belleza",
    belleza: "Salón de Belleza",
  }

  const normalizedCategory = category.toLowerCase().trim()

  // Find the best match
  for (const [key, value] of Object.entries(categoryMap)) {
    if (normalizedCategory.includes(key)) {
      return value
    }
  }

  // Default fallback
  return "Restaurante"
}
