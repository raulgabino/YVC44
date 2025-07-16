import { type NextRequest, NextResponse } from "next/server"
import { openai, MODELS } from "@/lib/config"
import type { Place } from "@/types/place"

export async function POST(request: NextRequest) {
  try {
    const { vibe, city } = await request.json()
    console.log("🔍 GPT search request:", { vibe, city })

    if (!vibe || !city) {
      console.log("❌ Missing vibe or city")
      return NextResponse.json([])
    }

    if (!openai) {
      console.log("⚠️ OpenAI not configured - returning empty results")
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
- Los lugares deben existir y estar operando actualmente en ${city}, México
- Categorías preferidas: restaurantes, cafés, bares, boutiques, espacios culturales, librerías
- Deben ser populares o tener buenas reseñas
- La relevancia para el vibe "${vibe}" es lo más importante

INSTRUCCIONES CRÍTICAS:
- Si NO conoces lugares específicos en ${city}, responde con un array vacío: []
- NO inventes nombres, direcciones o descripciones
- Es mejor no devolver nada que información incorrecta
- Solo menciona lugares de los que estés seguro que existen en ${city}

FORMATO DE RESPUESTA - JSON únicamente:
[
  {
    "name": "Nombre Exacto del Lugar",
    "category": "Restaurante|Café|Bar y Cantina|Boutique|Espacio Cultural|Librería con Encanto|Salón de Belleza",
    "address": "Dirección completa y verificable en ${city}",
    "description_short": "Descripción breve (máx 120 caracteres) explicando por qué se ajusta al vibe."
  }
]

Responde ÚNICAMENTE con el array JSON, sin texto adicional.`

    console.log("🚀 Sending to OpenAI GPT...")

    // Add timeout protection
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    let gptResponse
    try {
      gptResponse = await Promise.race([
        openai.chat.completions.create(
          {
            model: MODELS.OPENAI.FALLBACK, // Use gpt-4o-mini for cost efficiency
            messages: [
              {
                role: "system",
                content:
                  "Eres un experto local en ciudades mexicanas que conoce lugares actuales y reales. Tu especialidad es recomendar lugares específicos que realmente existen. Si no conoces lugares específicos en una ciudad, es mejor que no respondas nada. Responde ÚNICAMENTE con JSON válido, sin explicaciones adicionales.",
              },
              {
                role: "user",
                content: searchPrompt,
              },
            ],
            temperature: 0.1, // Low temperature for precise responses
            max_tokens: 800,
          },
          { signal: controller.signal },
        ),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Request timeout")), 15000)),
      ])
    } catch (timeoutError) {
      console.error("⏰ GPT request timeout:", timeoutError)
      return NextResponse.json([])
    } finally {
      clearTimeout(timeoutId)
    }

    console.log("📡 GPT response received")

    const content = gptResponse.choices[0]?.message?.content

    console.log("📥 GPT response:", {
      hasContent: !!content,
      contentLength: content?.length || 0,
      preview: content?.substring(0, 200) + "...",
    })

    if (!content) {
      console.warn("⚠️ No content from GPT")
      return NextResponse.json([])
    }

    let placesData: any[] = []
    try {
      // Enhanced JSON parsing
      const cleanContent = content.trim()

      // Try to extract JSON array if wrapped in other text
      const jsonMatch = cleanContent.match(/\[\s*{[\s\S]*}\s*\]/)
      const jsonStr = jsonMatch ? jsonMatch[0] : cleanContent

      placesData = JSON.parse(jsonStr)
      console.log("✅ Parsed GPT data:", placesData.length, "places")

      // Validate parsed data
      if (!Array.isArray(placesData)) {
        throw new Error("Parsed data is not an array")
      }
    } catch (parseError) {
      console.error("❌ Error parsing GPT response:", parseError)
      console.log("📄 Raw content:", content.substring(0, 500) + "...")
      return NextResponse.json([])
    }

    const formattedPlaces: Place[] = placesData
      .slice(0, 3)
      .filter((place) => place && typeof place === "object")
      .map((place, index) => ({
        id: 4000 + index, // Different ID range to distinguish from other sources
        name: place.name?.trim() || `Lugar encontrado en ${city}`,
        category: mapCategory(place.category) || "Restaurante",
        address: place.address?.trim() || `${city}, México`,
        city: city as Place["city"],
        description_short:
          place.description_short?.trim().substring(0, 150) ||
          `Un lugar perfecto para ${vibe.toLowerCase()} según recomendaciones locales.`,
        playlists: [vibe] as any,
        source: "gpt" as const,
      }))
      .filter((place) => place.name && place.name.length > 3)

    console.log("🎯 Returning formatted places:", {
      count: formattedPlaces.length,
      places: formattedPlaces.map((p) => ({ name: p.name, category: p.category })),
    })

    return NextResponse.json(formattedPlaces)
  } catch (error) {
    console.error("💥 Error in GPT search:", error)
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
