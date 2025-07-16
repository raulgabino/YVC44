import { type NextRequest, NextResponse } from "next/server"
import { openai, MODELS, MODEL_CONFIGS } from "@/lib/api-config"

function getCurrentHour(): number {
  return new Date().getHours()
}

function buildMainPrompt(query: string): string {
  return `Eres un experto en lenguaje coloquial mexicano especializado en interpretar "vibes" para lugares.

CONTEXTO: YCV Playlists es como "Spotify para lugares" - los usuarios buscan sitios según su estado de ánimo.

TAREA: Analiza: "${query}" y extrae:
1. VIBE (obligatorio): Una de estas 10 opciones exactas
2. CIUDAD (obligatorio): CDMX, Monterrey, o Guadalajara

VIBES DISPONIBLES:
- Traka: Fiesta intensa, reventón, parrandear, ambiente de club, "irse de traka"
- Bellakeo: Seducir, ligar, ambiente sensual/sexual, "perrear", "bellakear"
- Tranqui: Relajado, chill, sin prisa, "echarse la hueva", ambiente zen
- Godínez: Profesional, ejecutivo, formal, "godín lifestyle", después del trabajo
- Dominguero: Familiar, casual, fin de semana, "dominguear", ambiente hogareño
- Chambeador: Productivo, trabajar, estudiar, "echarle ganas", wifi y silencio
- Tóxico: Intenso, dramático, procesar emociones, "toxiquear", catártico
- Dateo: Romántico, cita, conquistar, "salir con alguien", íntimo
- Crudo: Resaca, recovery, comfort food, "estar crudo", desayunos curativos
- Barbón: Sofisticado, elegante, clase alta, "fresa", exclusivo

CIUDADES (mapeo automático):
- gdl/guadalajara/tapatío/jalisco → Guadalajara
- cdmx/df/chilango/ciudad de méxico/mexico city → CDMX
- mty/monterrey/regio/nuevo león → Monterrey
- Sin mención específica → CDMX (default)

RESPONDE SOLO CON JSON VÁLIDO (sin explicaciones):
{"vibe": "nombre_exacto", "city": "ciudad_exacta"}`
}

function buildFallbackPrompt(query: string, currentHour: number): string {
  return `ANÁLISIS FALLBACK para: "${query}"

La búsqueda no pudo categorizarse automáticamente. Usa contexto inteligente:

CONTEXTO TEMPORAL (hora actual: ${currentHour}):
- 0-6: Traka (madrugada de fiesta)
- 7-11: Chambeador (mañana productiva)
- 12-17: Tranqui (tarde relajada)
- 18-23: Bellakeo/Dateo (noche social)

Responde con el JSON más probable:
{"vibe": "mejor_opción", "city": "ciudad_probable"}`
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required and must be a non-empty string" }, { status: 400 })
    }

    // Verificar que OpenAI esté configurado
    if (!openai) {
      console.error("OPENAI_API_KEY not configured")
      const manualAnalysis = analyzeQueryManually(query.trim())
      return NextResponse.json({
        ...manualAnalysis,
        model_used: "manual",
        confidence: "low",
        error: "OpenAI not configured",
      })
    }

    const mainPrompt = buildMainPrompt(query.trim())

    // Análisis principal con o3-mini (con timeout)
    try {
      const primaryConfig = MODEL_CONFIGS[MODELS.OPENAI.PRIMARY]
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const completion = await Promise.race([
        openai.chat.completions.create({
          model: MODELS.OPENAI.PRIMARY,
          messages: [
            {
              role: "system",
              content: "Eres un experto en cultura mexicana y análisis de texto. Responde SIEMPRE con JSON válido.",
            },
            {
              role: "user",
              content: mainPrompt,
            },
          ],
          ...primaryConfig,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000)),
      ])

      clearTimeout(timeoutId)

      const response = completion.choices[0].message.content?.trim()

      if (response) {
        try {
          const jsonMatch = response.match(/\{[^}]*\}/)
          const jsonStr = jsonMatch ? jsonMatch[0] : response
          const parsed = JSON.parse(jsonStr)

          if (parsed.vibe && parsed.city) {
            const validVibes = [
              "Traka",
              "Bellakeo",
              "Tranqui",
              "Godínez",
              "Dominguero",
              "Chambeador",
              "Tóxico",
              "Dateo",
              "Crudo",
              "Barbón",
            ]
            const validCities = ["CDMX", "Monterrey", "Guadalajara"]

            if (validVibes.includes(parsed.vibe) && validCities.includes(parsed.city)) {
              return NextResponse.json({
                ...parsed,
                model_used: MODELS.OPENAI.PRIMARY,
                confidence: "high",
              })
            }
          }
        } catch (parseError) {
          console.warn(`${MODELS.OPENAI.PRIMARY} JSON parsing failed, trying fallback:`, parseError)
        }
      }
    } catch (openaiError) {
      console.warn(`${MODELS.OPENAI.PRIMARY} request failed, trying ${MODELS.OPENAI.FALLBACK} fallback:`, openaiError)
    }

    // Fallback con gpt-4o-mini (con timeout)
    try {
      const currentHour = getCurrentHour()
      const fallbackPrompt = buildFallbackPrompt(query.trim(), currentHour)
      const fallbackConfig = MODEL_CONFIGS[MODELS.OPENAI.FALLBACK]
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

      const fallbackCompletion = await Promise.race([
        openai.chat.completions.create({
          model: MODELS.OPENAI.FALLBACK,
          messages: [
            {
              role: "system",
              content: "Analiza el contexto y da la mejor interpretación posible. Responde con JSON válido.",
            },
            {
              role: "user",
              content: fallbackPrompt,
            },
          ],
          ...fallbackConfig,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000)),
      ])

      clearTimeout(timeoutId)

      const fallbackResponse = fallbackCompletion.choices[0].message.content?.trim()

      if (fallbackResponse) {
        try {
          const jsonMatch = fallbackResponse.match(/\{[^}]*\}/)
          const jsonStr = jsonMatch ? jsonMatch[0] : fallbackResponse
          const parsed = JSON.parse(jsonStr)

          if (parsed.vibe && parsed.city) {
            return NextResponse.json({
              ...parsed,
              model_used: MODELS.OPENAI.FALLBACK,
              confidence: "medium",
            })
          }
        } catch (parseError) {
          console.warn(`${MODELS.OPENAI.FALLBACK} JSON parsing failed:`, parseError)
        }
      }
    } catch (fallbackError) {
      console.error(`${MODELS.OPENAI.FALLBACK} fallback failed:`, fallbackError)
    }

    // Último fallback: análisis manual
    const manualAnalysis = analyzeQueryManually(query.trim())
    return NextResponse.json({
      ...manualAnalysis,
      model_used: "manual",
      confidence: "low",
    })
  } catch (error) {
    console.error("Error in vibe detection:", error)
    return NextResponse.json({ error: "Error processing vibe detection" }, { status: 500 })
  }
}

function analyzeQueryManually(query: string): { vibe: string; city: string } {
  const lowerQuery = query.toLowerCase()

  let city = "CDMX"
  if (
    lowerQuery.includes("gdl") ||
    lowerQuery.includes("guadalajara") ||
    lowerQuery.includes("tapatío") ||
    lowerQuery.includes("zapopan")
  ) {
    city = "Guadalajara"
  } else if (
    lowerQuery.includes("mty") ||
    lowerQuery.includes("monterrey") ||
    lowerQuery.includes("regio") ||
    lowerQuery.includes("san pedro")
  ) {
    city = "Monterrey"
  }

  // Enhanced keyword detection
  const vibeKeywords = {
    Bellakeo: ["bellak", "ligar", "seducir", "perrear", "sensual", "sexual"],
    Traka: ["traka", "fiesta", "reventón", "parrandear", "club", "antro"],
    Tranqui: ["tranqui", "chill", "relajad", "zen", "calm", "peace"],
    Godínez: ["godín", "trabajo", "oficina", "ejecutivo", "profesional", "formal"],
    Crudo: ["crudo", "resaca", "desayun", "recovery", "hangover"],
    Dateo: ["romántico", "cita", "dateo", "conquistar", "íntimo", "pareja"],
    Barbón: ["fresa", "elegante", "sofisticad", "clase", "exclusivo", "premium"],
    Chambeador: ["estudiar", "trabajar", "productiv", "wifi", "laptop", "concentrar"],
    Dominguero: ["familia", "domingo", "casual", "hogareño", "brunch", "familiar"],
    Tóxico: ["tóxico", "dramátic", "intenso", "emocional", "catártico", "procesar"],
  }

  for (const [vibe, keywords] of Object.entries(vibeKeywords)) {
    if (keywords.some((keyword) => lowerQuery.includes(keyword))) {
      return { vibe, city }
    }
  }

  return { vibe: "Tranqui", city }
}
