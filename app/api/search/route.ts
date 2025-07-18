import { type NextRequest, NextResponse } from "next/server"
import { callPerplexityAPI, MODELS } from "@/lib/config"
import type { Place } from "@/types/place"

export async function POST(request: NextRequest) {
  try {
    const { vibe, city } = await request.json()
    console.log("🔍 Perplexity search request:", { vibe, city })

    if (!vibe || !city) {
      return NextResponse.json([])
    }

    // Sistema de perfiles de vibe para Perplexity
    const vibeProfiles: Record<string, { description: string; context: string }> = {
      Traka: {
        description: "fiesta, diversión, vida nocturna, música en vivo, antros",
        context: "lugares para reventón, ambiente de club, música alta",
      },
      Bellakeo: {
        description: "ambiente seductor, sensual, para ligar, cocktails sofisticados",
        context: "lugares íntimos pero con ambiente sensual, bares de cocktails",
      },
      Tranqui: {
        description: "relajado, sin presión, chill, ambiente zen, terrazas",
        context: "lugares para descansar, conversar tranquilo, cafés con terraza",
      },
      Godínez: {
        description: "profesional, formal, ejecutivo, wifi, cerca de oficinas",
        context: "lugares para reuniones de trabajo, después de oficina",
      },
      Dominguero: {
        description: "familiar, casual, para fines de semana, brunch, niños",
        context: "lugares para familias, ambiente hogareño, restaurantes familiares",
      },
      Chambeador: {
        description: "para trabajar, estudiar, wifi confiable, silencioso",
        context: "lugares productivos, cafés para laptop, coworking",
      },
      Tóxico: {
        description: "intenso, dramático, para procesar emociones, mezcal",
        context: "lugares para desahogarse, bares oscuros, cantinas",
      },
      Dateo: {
        description: "romántico, para citas, íntimo, elegante, velas",
        context: "lugares para parejas, restaurantes románticos, terrazas con vista",
      },
      Crudo: {
        description: "lugares casuales para resaca, fondas populares, tacos, caldos",
        context: "lugares sin pretensiones, baratos, tradicionales, comfort food",
      },
      Barbón: {
        description: "sofisticado, elegante, exclusivo, premium, vinos",
        context: "lugares caros, con clase, restaurantes premium, wine bars",
      },
      Instagrameable: {
        description: "trendy, fotogénico, viral, aesthetic, para fotos",
        context: "lugares modernos, con diseño llamativo, cafés aesthetic",
      },
    }

    const vibeProfile = vibeProfiles[vibe] || {
      description: vibe.toLowerCase(),
      context: `lugares para ${vibe.toLowerCase()}`,
    }

    // 🌐 PASO 1: Intentar Perplexity primero
    console.log("🌐 Step 1: Trying Perplexity API...")
    try {
      const perplexityPrompt = `Busca lugares reales y actuales en ${city}, México que sean perfectos para "${vibe}".

CONTEXTO DEL VIBE "${vibe}":
${vibeProfile.description}
${vibeProfile.context}

INSTRUCCIONES:
- Solo lugares que REALMENTE existen en ${city}, México
- Que estén operando actualmente (2024)
- Máximo 3 lugares
- Enfócate en ${vibeProfile.context}

FORMATO DE RESPUESTA - JSON únicamente:
[
  {
    "name": "Nombre exacto del lugar",
    "category": "Restaurante|Café|Bar y Cantina|Boutique|Espacio Cultural|Salón de Belleza|Librería con Encanto",
    "address": "Dirección completa en ${city}",
    "description_short": "Por qué es perfecto para ${vibe} (máximo 120 caracteres)"
  }
]

Responde ÚNICAMENTE con el array JSON, sin texto adicional.`

      const perplexityResponse = await callPerplexityAPI(
        [
          {
            role: "system",
            content: "Eres un experto local en ciudades mexicanas. Responde únicamente con JSON válido.",
          },
          {
            role: "user",
            content: perplexityPrompt,
          },
        ],
        MODELS.PERPLEXITY.PRIMARY,
      )

      const perplexityContent = perplexityResponse.choices[0]?.message?.content

      if (perplexityContent) {
        console.log("📥 Perplexity response received")
        try {
          const cleanContent = perplexityContent.trim()
          const jsonMatch = cleanContent.match(/\[\s*{[\s\S]*}\s*\]/)
          const jsonStr = jsonMatch ? jsonMatch[0] : cleanContent

          const perplexityPlaces = JSON.parse(jsonStr)

          if (Array.isArray(perplexityPlaces) && perplexityPlaces.length > 0) {
            const formattedPlaces: Place[] = perplexityPlaces
              .slice(0, 3)
              .filter((place) => place && typeof place === "object" && place.name)
              .map((place, index) => ({
                id: 5000 + index,
                name: place.name?.trim() || `Lugar en ${city}`,
                category: mapCategory(place.category) || "Restaurante",
                address: place.address?.trim() || `${city}, México`,
                city: city,
                description_short:
                  place.description_short?.trim().substring(0, 150) || `Un lugar perfecto para ${vibe.toLowerCase()}.`,
                playlists: [vibe],
                source: "web" as const,
              }))

            if (formattedPlaces.length > 0) {
              console.log(`✅ Perplexity success: ${formattedPlaces.length} places`)
              return NextResponse.json(formattedPlaces)
            }
          }
        } catch (parseError) {
          console.warn("⚠️ Perplexity JSON parsing failed:", parseError)
        }
      }
    } catch (perplexityError) {
      console.warn("⚠️ Perplexity API failed:", perplexityError)
    }

    // 🤖 PASO 2: Fallback a OpenAI GPT (modelo original)
    console.log("🤖 Step 2: Falling back to OpenAI GPT...")

    if (!process.env.OPENAI_API_KEY) {
      console.log("❌ No OpenAI API key available")
      return NextResponse.json([])
    }

    const gptPrompt = `Busca lugares REALES y OPERATIVOS en ${city}, México que encajen perfectamente con el ambiente: "${vibeProfile.description}".

CRITERIOS ESTRICTOS:
- Los lugares deben existir y estar operando actualmente en ${city}, México
- Categorías preferidas: restaurantes, cafés, bares, boutiques, espacios culturales
- Deben ser populares o tener buenas reseñas
- La relevancia para el vibe "${vibe}" es lo más importante

INSTRUCCIONES CRÍTICAS:
- Si NO conoces lugares específicos en ${city}, responde con un array vacío: []
- NO inventes nombres, direcciones o descripciones
- Es mejor no devolver nada que información incorrecta

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
            content:
              "Eres un experto local en ciudades mexicanas que conoce lugares actuales y reales. Responde ÚNICAMENTE con JSON válido, sin explicaciones adicionales.",
          },
          {
            role: "user",
            content: gptPrompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 800,
      }),
    })

    if (!gptResponse.ok) {
      console.error("❌ OpenAI API error:", gptResponse.status)
      return NextResponse.json([])
    }

    const gptData = await gptResponse.json()
    const gptContent = gptData.choices[0]?.message?.content

    if (!gptContent) {
      console.warn("⚠️ No content from OpenAI")
      return NextResponse.json([])
    }

    try {
      const cleanContent = gptContent.trim()
      const jsonMatch = cleanContent.match(/\[\s*{[\s\S]*}\s*\]/)
      const jsonStr = jsonMatch ? jsonMatch[0] : cleanContent

      const gptPlaces = JSON.parse(jsonStr)

      if (Array.isArray(gptPlaces)) {
        const formattedPlaces: Place[] = gptPlaces
          .slice(0, 3)
          .filter((place) => place && typeof place === "object" && place.name)
          .map((place, index) => ({
            id: 4000 + index,
            name: place.name?.trim() || `Lugar encontrado en ${city}`,
            category: mapCategory(place.category) || "Restaurante",
            address: place.address?.trim() || `${city}, México`,
            city: city,
            description_short:
              place.description_short?.trim().substring(0, 150) ||
              `Un lugar perfecto para ${vibe.toLowerCase()} según recomendaciones locales.`,
            playlists: [vibe],
            source: "gpt" as const,
          }))

        console.log(`✅ OpenAI fallback success: ${formattedPlaces.length} places`)
        return NextResponse.json(formattedPlaces)
      }
    } catch (parseError) {
      console.error("❌ OpenAI JSON parsing failed:", parseError)
    }

    console.log("❌ All search methods failed")
    return NextResponse.json([])
  } catch (error) {
    console.error("💥 Error in search:", error)
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
