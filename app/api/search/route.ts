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

    console.log("Perplexity search request:", { vibe, city })

    if (!vibe || !city) {
      return NextResponse.json([])
    }

    // Verificar configuración de Perplexity
    const apiStatus = getApiStatus()
    if (!apiStatus.perplexity.configured) {
      console.warn("PERPLEXITY_API_KEY not configured, returning empty results")
      return NextResponse.json([])
    }

    // Mapear vibes a descripciones más naturales para la búsqueda
    const vibeDescriptions: Record<string, string> = {
      Traka: "fiesta, diversión, ambiente de celebración, vida nocturna, música en vivo",
      Bellakeo: "ambiente seductor, sensual, para ligar, romántico pero intenso, cocktails",
      Tranqui: "relajado, tranquilo, sin presión, chill, ambiente zen, terraza",
      Godínez: "profesional, formal, para después del trabajo, ejecutivo, wifi",
      Dominguero: "familiar, casual, para fines de semana, ambiente hogareño, brunch",
      Chambeador: "para trabajar, estudiar, productivo, wifi, silencioso, café",
      Tóxico: "intenso, dramático, para procesar emociones, catártico, mezcal",
      Dateo: "romántico, para citas, íntimo, elegante, velas",
      Crudo: "para la resaca, comfort food, recovery, desayunos, jugos",
      Barbón: "sofisticado, elegante, con clase, exclusivo, premium, vinos",
    }

    const vibeDescription = vibeDescriptions[vibe] || vibe.toLowerCase()

    // Crear prompt optimizado para Perplexity
    const searchPrompt = `Encuentra los mejores lugares en ${city}, México que tengan un ambiente de ${vibeDescription}. 

Busca específicamente restaurantes, cafés, bares, boutiques, espacios culturales o librerías que coincidan con este vibe y que estén actualmente operando en 2024.

Para cada lugar, proporciona:
- Nombre exacto del lugar
- Categoría (Restaurante, Café, Bar y Cantina, Boutique, Espacio Cultural, Salón de Belleza, o Librería con Encanto)
- Dirección completa con colonia
- Descripción breve del ambiente y por qué encaja con el vibe (máximo 100 caracteres)

Enfócate en lugares reales, populares y bien valorados. Responde SOLO con un JSON válido con máximo 3 lugares.

Formato requerido:
[
  {
    "name": "Nombre del lugar",
    "category": "Categoría",
    "address": "Dirección completa",
    "description_short": "Descripción breve"
  }
]`

    console.log("Sending to Perplexity:", { prompt: searchPrompt.substring(0, 100) + "..." })

    // Llamada a Perplexity con timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    try {
      const data: PerplexityResponse = await Promise.race([
        callPerplexityAPI(
          [
            {
              role: "system",
              content:
                "Eres un experto local en ciudades mexicanas que ayuda a encontrar lugares específicos basándose en vibes y ambientes. Siempre respondes con información actual y verificable en formato JSON válido.",
            },
            {
              role: "user",
              content: searchPrompt,
            },
          ],
          MODELS.PERPLEXITY.PRIMARY,
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 15000)),
      ])

      clearTimeout(timeoutId)

      const content = data.choices[0]?.message?.content
      console.log("Perplexity raw response:", content?.substring(0, 200) + "...")

      if (!content) {
        console.warn("No content from Perplexity")
        return NextResponse.json([])
      }

      // Extraer JSON del contenido de la respuesta
      let placesData: any[] = []
      try {
        // Buscar el JSON en la respuesta
        const jsonMatch = content.match(/\[\s*{[\s\S]*}\s*\]/)
        if (jsonMatch) {
          placesData = JSON.parse(jsonMatch[0])
          console.log("Parsed Perplexity data:", placesData.length, "places")
        } else {
          // Intentar parsear toda la respuesta como JSON
          placesData = JSON.parse(content)
        }
      } catch (parseError) {
        console.error("Error parsing Perplexity response:", parseError)
        console.log("Raw content:", content)
        return NextResponse.json([])
      }

      // Transformar a nuestro formato y agregar metadatos
      const formattedPlaces: Place[] = placesData.slice(0, 3).map((place, index) => ({
        id: 3000 + index, // IDs únicos para resultados de Perplexity
        name: place.name || `Lugar encontrado en ${city}`,
        category: mapCategory(place.category) || "Restaurante",
        address: place.address || `${city}, México`,
        city: city as "CDMX" | "Monterrey" | "Guadalajara",
        description_short:
          place.description_short || `Un lugar perfecto para ${vibe.toLowerCase()} según reseñas recientes.`,
        playlists: [vibe] as any,
        source: "web" as const,
      }))

      console.log("Returning formatted places:", formattedPlaces.length)
      return NextResponse.json(formattedPlaces)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error) {
    console.error("Error in Perplexity search:", error)

    // Retornar array vacío en lugar de error para no romper la experiencia
    return NextResponse.json([])
  }
}

// Función auxiliar para mapear categorías a nuestros tipos válidos
function mapCategory(category: string): Place["category"] {
  const categoryMap: Record<string, Place["category"]> = {
    restaurante: "Restaurante",
    café: "Café",
    bar: "Bar y Cantina",
    cantina: "Bar y Cantina",
    boutique: "Boutique",
    tienda: "Boutique",
    galería: "Espacio Cultural",
    museo: "Espacio Cultural",
    librería: "Librería con Encanto",
    salón: "Salón de Belleza",
    barbería: "Salón de Belleza",
  }

  const normalizedCategory = category?.toLowerCase() || ""

  for (const [key, value] of Object.entries(categoryMap)) {
    if (normalizedCategory.includes(key)) {
      return value
    }
  }

  return "Restaurante" // Default
}
