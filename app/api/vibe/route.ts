import { type NextRequest, NextResponse } from "next/server"
import { openai, MODELS, MODEL_CONFIGS } from "@/lib/config"

function buildMainPrompt(query: string): string {
  return `Eres un experto en lenguaje coloquial mexicano. Analiza esta búsqueda: "${query}"

EXTRAE EXACTAMENTE:
1. VIBE: Una de estas 10 opciones EXACTAS
2. CIUDAD: CDMX, Monterrey, Guadalajara, Ciudad Victoria, o San Miguel de Allende

VIBES DISPONIBLES (elige UNA):
- Traka: "fiesta", "reventón", "parrandear", "traka", "party"
- Bellakeo: "bellakear", "bellaquear", "ligar", "seducir", "perrear", "sensual"
- Tranqui: "tranqui", "chill", "relajado", "zen", "calma"
- Godínez: "godín", "trabajo", "oficina", "profesional", "ejecutivo"
- Dominguero: "domingo", "familia", "casual", "dominguero", "familiar"
- Chambeador: "chambear", "estudiar", "trabajar", "productivo", "wifi"
- Tóxico: "tóxico", "dramático", "intenso", "emocional", "catártico"
- Dateo: "cita", "romántico", "dateo", "íntimo", "pareja"
- Crudo: "crudo", "resaca", "hangover", "desayuno", "recovery"
- Barbón: "barbón", "fresa", "elegante", "sofisticado", "exclusivo", "clase alta"

EJEMPLOS ESPECÍFICOS:
"algo para bellakear en gdl" → {"vibe": "Bellakeo", "city": "Guadalajara"}
"un lugar tranqui en la Roma" → {"vibe": "Tranqui", "city": "CDMX"}
"donde desayunar crudo en Polanco" → {"vibe": "Crudo", "city": "CDMX"}
"un bar barbón en Monterrey" → {"vibe": "Barbón", "city": "Monterrey"}
"café para chambear en la Condesa" → {"vibe": "Chambeador", "city": "CDMX"}
"lugar dominguero en Santa Fe" → {"vibe": "Dominguero", "city": "CDMX"}

CIUDADES:
- gdl/guadalajara/zapopan → Guadalajara
- mty/monterrey/san pedro → Monterrey
- cdmx/df/polanco/roma/condesa/santa fe → CDMX
- ciudad victoria/victoria → Ciudad Victoria
- san miguel/san miguel de allende → San Miguel de Allende
- Sin ciudad específica → CDMX

RESPONDE SOLO JSON:
{"vibe": "nombre_exacto", "city": "ciudad_exacta"}`
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required and must be a non-empty string" }, { status: 400 })
    }

    console.log("🔍 Analyzing query:", query)

    if (!openai) {
      console.warn("⚠️ OpenAI not configured, using manual analysis")
      const manualResult = analyzeQueryManually(query.trim())
      return NextResponse.json({
        ...manualResult,
        model_used: "manual",
        confidence: "low",
      })
    }

    const mainPrompt = buildMainPrompt(query.trim())

    // Try primary model first
    try {
      console.log("🤖 Calling OpenAI with primary model...")
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const completion = await Promise.race([
        openai.chat.completions.create(
          {
            model: MODELS.OPENAI.PRIMARY,
            messages: [
              {
                role: "system",
                content: "Responde SOLO con JSON válido. No agregues explicaciones.",
              },
              {
                role: "user",
                content: mainPrompt,
              },
            ],
            ...MODEL_CONFIGS[MODELS.OPENAI.PRIMARY],
          },
          { signal: controller.signal },
        ),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 10000)),
      ])

      clearTimeout(timeoutId)

      const response = completion.choices[0].message.content?.trim()
      console.log("📥 OpenAI response:", response)

      if (response) {
        try {
          const jsonMatch = response.match(/\{[^}]*\}/)
          const jsonStr = jsonMatch ? jsonMatch[0] : response
          const parsed = JSON.parse(jsonStr)

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
          const validCities = ["CDMX", "Monterrey", "Guadalajara", "Ciudad Victoria", "San Miguel de Allende"]

          if (parsed.vibe && parsed.city && validVibes.includes(parsed.vibe) && validCities.includes(parsed.city)) {
            console.log("✅ Valid detection:", parsed)
            return NextResponse.json({
              ...parsed,
              model_used: MODELS.OPENAI.PRIMARY,
              confidence: "high",
            })
          }
        } catch (parseError) {
          console.error("❌ JSON parsing failed:", parseError)
        }
      }
    } catch (openaiError) {
      console.error("❌ Primary model failed:", openaiError)
    }

    // Try fallback model
    try {
      console.log("🔄 Trying fallback model...")
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000)

      const fallbackCompletion = await Promise.race([
        openai.chat.completions.create(
          {
            model: MODELS.OPENAI.FALLBACK,
            messages: [
              {
                role: "system",
                content: "Analiza el contexto y da la mejor interpretación posible. Responde con JSON válido.",
              },
              {
                role: "user",
                content: mainPrompt,
              },
            ],
            ...MODEL_CONFIGS[MODELS.OPENAI.FALLBACK],
          },
          { signal: controller.signal },
        ),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000)),
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
          console.warn("⚠️ Fallback JSON parsing failed:", parseError)
        }
      }
    } catch (fallbackError) {
      console.error("❌ Fallback model failed:", fallbackError)
    }

    // Final fallback: manual analysis
    console.log("🔧 Using manual analysis")
    const manualResult = analyzeQueryManually(query.trim())

    return NextResponse.json({
      ...manualResult,
      model_used: "manual",
      confidence: "low",
    })
  } catch (error) {
    console.error("💥 Error in vibe detection:", error)
    return NextResponse.json({ error: "Error processing vibe detection" }, { status: 500 })
  }
}

function analyzeQueryManually(query: string): { vibe: string; city: string } {
  const lowerQuery = query.toLowerCase()

  // Enhanced city detection
  let city = "CDMX"
  if (lowerQuery.includes("gdl") || lowerQuery.includes("guadalajara") || lowerQuery.includes("zapopan")) {
    city = "Guadalajara"
  } else if (lowerQuery.includes("mty") || lowerQuery.includes("monterrey") || lowerQuery.includes("san pedro")) {
    city = "Monterrey"
  } else if (lowerQuery.includes("ciudad victoria") || lowerQuery.includes("victoria")) {
    city = "Ciudad Victoria"
  } else if (lowerQuery.includes("san miguel") || lowerQuery.includes("allende")) {
    city = "San Miguel de Allende"
  } else if (
    lowerQuery.includes("polanco") ||
    lowerQuery.includes("roma") ||
    lowerQuery.includes("condesa") ||
    lowerQuery.includes("santa fe")
  ) {
    city = "CDMX"
  }

  // Enhanced vibe detection with priority order
  const vibePatterns = [
    { vibe: "Bellakeo", keywords: ["bellak", "bellaque", "ligar", "seducir", "perrear"] },
    { vibe: "Barbón", keywords: ["barbón", "fresa", "elegante", "sofisticad", "exclusivo", "clase alta"] },
    { vibe: "Chambeador", keywords: ["chambear", "trabajar", "estudiar", "wifi", "productiv"] },
    { vibe: "Crudo", keywords: ["crudo", "resaca", "desayun", "hangover", "recovery"] },
    { vibe: "Traka", keywords: ["traka", "fiesta", "reventón", "parrandear", "party"] },
    { vibe: "Dateo", keywords: ["romántico", "cita", "dateo", "íntimo", "pareja"] },
    { vibe: "Godínez", keywords: ["godín", "trabajo", "oficina", "ejecutivo", "profesional"] },
    { vibe: "Dominguero", keywords: ["dominguero", "familia", "domingo", "casual", "familiar"] },
    { vibe: "Tóxico", keywords: ["tóxico", "dramátic", "intenso", "emocional", "catártico"] },
    { vibe: "Tranqui", keywords: ["tranqui", "chill", "relajad", "zen", "calma"] },
  ]

  for (const { vibe, keywords } of vibePatterns) {
    if (keywords.some((keyword) => lowerQuery.includes(keyword))) {
      return { vibe, city }
    }
  }

  return { vibe: "Tranqui", city }
}
