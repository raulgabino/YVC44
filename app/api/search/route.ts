import { type NextRequest, NextResponse } from "next/server"
import type { Place } from "@/types/place"

const PERPLEXITY_CONFIG = {
  model: "llama-3.1-sonar-small-128k-online",
  max_tokens: 1000,
  temperature: 0.3,
  top_p: 0.9,
  search_domain_filter: ["mexico"],
  return_images: false,
  return_related_questions: false,
  search_recency_filter: "month",
} as const

export async function POST(request: NextRequest) {
  try {
    const { vibe, city } = await request.json()

    console.log("🔍 Perplexity search request:", { vibe, city })
    console.log("🔑 PERPLEXITY_API_KEY configured:", !!process.env.PERPLEXITY_API_KEY)

    if (!vibe || !city) {
      console.log("❌ Missing vibe or city")
      return NextResponse.json([])
    }

    if (!process.env.PERPLEXITY_API_KEY) {
      console.log("⚠️ PERPLEXITY_API_KEY not configured - returning empty results")
      return NextResponse.json([])
    }

    const vibeDescriptions: Record<string, string> = {
      Traka: "fiesta intensa, reventón, ambiente de club, vida nocturna vibrante, música en vivo",
      Bellakeo: "ambiente seductor, sensual, para ligar, romántico pero intenso, cocktails sofisticados",
      Tranqui: "relajado, tranquilo, sin presión, chill, ambiente zen, terraza acogedora",
      Godínez: "profesional, formal, para después del trabajo, ejecutivo, wifi confiable",
      Dominguero: "familiar, casual, para fines de semana, ambiente hogareño, brunch, pet-friendly",
      Chambeador: "para trabajar, estudiar, productivo, wifi excelente, silencioso, enchufes",
      Tóxico: "intenso, dramático, para procesar emociones, catártico, ambiente introspectivo",
      Dateo: "romántico, para citas, íntimo, elegante, velas, música suave",
      Crudo: "para la resaca, comfort food, recovery, desayunos curativos, jugos naturales",
      Barbón: "sofisticado, elegante, con clase, exclusivo, premium, carta de vinos selecta",
    }

    const vibeDescription = vibeDescriptions[vibe] || vibe.toLowerCase()

    const searchPrompt = `Busca hasta 3 lugares REALES y OPERATIVOS en ${city}, México que encajen perfectamente con el ambiente: "${vibeDescription}".

CRITERIOS ESTRICTOS:
- Los lugares deben existir y estar operando actualmente.
- Categorías preferidas: restaurantes, cafés, bares, boutiques, espacios culturales, librerías.
- Deben ser populares o tener buenas reseñas. La relevancia para el vibe "${vibe}" es lo más importante.

FORMATO DE RESPUESTA - JSON únicamente:
[
  {
    "name": "Nombre Exacto del Lugar",
    "category": "Restaurante|Café|Bar y Cantina|Boutique|Espacio Cultural|Librería con Encanto|Salón de Belleza",
    "address": "Dirección completa y verificable en ${city}",
    "description_short": "Descripción breve (máx 120 caracteres) explicando por qué se ajusta al vibe.",
    "phone": "+52 xxx xxx xxxx (SOLO si estás seguro del número, omite si no)",
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
]

IMPORTANTE: 
- Solo incluye "phone" si estás 100% seguro del número
- Solo incluye "hours" si conoces los horarios reales
- Omite campos inciertos - es mejor no tener info que info incorrecta
`

    console.log("🚀 Sending to Perplexity...")

    // Add timeout protection
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    let perplexityResponse: Response
    try {
      perplexityResponse = await Promise.race([
        fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...PERPLEXITY_CONFIG,
            messages: [
              {
                role: "system",
                content:
                  "Eres un experto local en ciudades mexicanas que conoce los lugares más actuales y verificados. Responde ÚNICAMENTE con JSON válido. Si no encuentras lugares que cumplan los criterios, devuelve un array vacío [].",
              },
              {
                role: "user",
                content: searchPrompt,
              },
            ],
          }),
          signal: controller.signal,
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 15000)),
      ])
    } catch (timeoutError) {
      console.error("⏰ Perplexity request timeout:", timeoutError)
      return NextResponse.json([])
    } finally {
      clearTimeout(timeoutId)
    }

    console.log("📡 Perplexity response status:", perplexityResponse.status)

    if (!perplexityResponse.ok) {
      const errorData = await perplexityResponse.json().catch(() => null)
      console.error("❌ Perplexity API error:", {
        status: perplexityResponse.status,
        error: errorData,
      })
      return NextResponse.json([])
    }

    const data = await perplexityResponse.json()
    const content = data.choices[0]?.message?.content

    console.log("📥 Perplexity response:", {
      hasContent: !!content,
      contentLength: content?.length || 0,
      preview: content?.substring(0, 200) + "...",
    })

    if (!content) {
      console.warn("⚠️ No content from Perplexity")
      return NextResponse.json([])
    }

    let placesData: any[] = []
    try {
      // Enhanced JSON parsing
      const jsonMatch = content.match(/\[\s*{[\s\S]*}\s*\]/)
      if (jsonMatch) {
        placesData = JSON.parse(jsonMatch[0])
        console.log("✅ Parsed Perplexity data:", placesData.length, "places")
      } else {
        console.log("🔄 Trying to parse full content as JSON")
        placesData = JSON.parse(content)
      }

      // Validate parsed data
      if (!Array.isArray(placesData)) {
        throw new Error("Parsed data is not an array")
      }
    } catch (parseError) {
      console.error("❌ Error parsing Perplexity response:", parseError)
      console.log("📄 Raw content:", content.substring(0, 500) + "...")
      return NextResponse.json([])
    }

    const formattedPlaces = placesData
      .slice(0, 3)
      .filter((place) => place && typeof place === "object")
      .map((place, index) => ({
        id: 3000 + index,
        name: place.name?.trim() || `Lugar encontrado en ${city}`,
        category: mapCategory(place.category) || "Restaurante",
        address: place.address?.trim() || `${city}, México`,
        city: city,
        phone: place.phone || undefined,
        hours: place.hours || undefined,
        description_short:
          place.description_short?.trim().substring(0, 150) ||
          `Un lugar perfecto para ${vibe.toLowerCase()} según búsquedas web recientes.`,
        playlists: [vibe] as any,
        source: "web" as const,
      }))
      .filter((place) => place.name && place.name.length > 3)

    console.log("🎯 Returning formatted places:", {
      count: formattedPlaces.length,
      places: formattedPlaces.map((p) => ({ name: p.name, category: p.category })),
    })

    return NextResponse.json(formattedPlaces)
  } catch (error) {
    console.error("💥 Error in Perplexity search:", error)
    return NextResponse.json([])
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
    librería: "Librería con Encanto",
    salón: "Salón de Belleza",
    barbería: "Salón de Belleza",
  }

  const normalizedCategory = category.toLowerCase().trim()

  for (const [key, value] of Object.entries(categoryMap)) {
    if (normalizedCategory.includes(key)) {
      return value
    }
  }

  return "Restaurante"
}
