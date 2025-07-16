import { type NextRequest, NextResponse } from "next/server"
import type { Place } from "@/types/place"

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
}

export async function POST(request: NextRequest) {
  try {
    const { vibe, city } = await request.json()

    if (!vibe || !city) {
      return NextResponse.json([])
    }

    // Mapear vibes a descripciones más naturales para la búsqueda
    const vibeDescriptions: Record<string, string> = {
      Traca: "fiesta, diversión, ambiente de celebración, vida nocturna, música en vivo",
      Bellaqueo: "ambiente seductor, sensual, para ligar, romántico pero intenso, cocktails",
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

    // Verificar que tenemos la API key
    if (!process.env.PERPLEXITY_API_KEY) {
      console.warn("PERPLEXITY_API_KEY not found, returning fallback results")
      return NextResponse.json(getFallbackResults(city, vibe))
    }

    // Llamada a la API de Perplexity con timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    try {
      const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.1-sonar-small-128k-online",
          messages: [
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
          max_tokens: 1000,
          temperature: 0.2,
          top_p: 0.9,
          search_domain_filter: ["mexico"],
          return_images: false,
          return_related_questions: false,
          search_recency_filter: "month",
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!perplexityResponse.ok) {
        throw new Error(`Perplexity API error: ${perplexityResponse.status}`)
      }

      const data: PerplexityResponse = await perplexityResponse.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        return NextResponse.json(getFallbackResults(city, vibe))
      }

      // Extraer JSON del contenido de la respuesta
      let placesData: any[] = []
      try {
        // Buscar el JSON en la respuesta
        const jsonMatch = content.match(/\[\s*{[\s\S]*}\s*\]/)
        if (jsonMatch) {
          placesData = JSON.parse(jsonMatch[0])
        } else {
          // Intentar parsear toda la respuesta como JSON
          placesData = JSON.parse(content)
        }
      } catch (parseError) {
        console.warn("Error parsing Perplexity response:", parseError)
        return NextResponse.json(getFallbackResults(city, vibe))
      }

      // Transformar a nuestro formato y agregar metadatos
      const formattedPlaces: Place[] = placesData.slice(0, 3).map((place, index) => ({
        id: 2000 + index, // IDs únicos para resultados web
        name: place.name || `Lugar encontrado en ${city}`,
        category: mapCategory(place.category) || "Restaurante",
        address: place.address || `${city}, México`,
        city: city as "CDMX" | "Monterrey" | "Guadalajara",
        description_short:
          place.description_short || `Un lugar perfecto para ${vibe.toLowerCase()} según reseñas recientes.`,
        playlists: [vibe] as any,
        source: "web" as const,
      }))

      return NextResponse.json(formattedPlaces)
    } catch (fetchError) {
      clearTimeout(timeoutId)
      throw fetchError
    }
  } catch (error) {
    console.error("Error in Perplexity search:", error)

    // Fallback con resultados genéricos
    return NextResponse.json(
      getFallbackResults((await request.json()).city || "CDMX", (await request.json()).vibe || "Tranqui"),
    )
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

// Función para generar resultados de fallback
function getFallbackResults(city: string, vibe: string): Place[] {
  return [
    {
      id: 2000,
      name: `Lugar ${vibe} recomendado`,
      category: "Restaurante",
      address: `${city}, México`,
      city: city as "CDMX" | "Monterrey" | "Guadalajara",
      description_short: `Lugar encontrado en búsquedas web para ${vibe.toLowerCase()}.`,
      playlists: [vibe] as any,
      source: "web" as const,
    },
  ]
}
