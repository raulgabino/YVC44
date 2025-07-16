import { type NextRequest, NextResponse } from "next/server"
import { openai, MODELS, MODEL_CONFIGS } from "@/lib/config"

function buildMainPrompt(query: string): string {
  return `Eres un experto en geografía mexicana y lenguaje coloquial. Analiza esta búsqueda: "${query}"

EXTRAE DOS DATOS EXACTOS:
1. **VIBE**: Una opción de la lista de VIBES DISPONIBLES
2. **CIUDAD**: El nombre completo y correcto de la ciudad mexicana mencionada

VIBES DISPONIBLES (elige SOLO UNA):
- Traka: fiesta, reventón, antro
- Bellakeo: ligar, perrear, sensual  
- Tranqui: relajado, chill, calmo
- Godínez: trabajo, oficina, profesional
- Dominguero: familia, casual, paseo
- Chambeador: trabajar, estudiar, wifi
- Tóxico: intenso, dramático, catarsis
- Dateo: cita, romántico, pareja
- Crudo: resaca, hangover, curar
- Barbón: fresa, elegante, sofisticado

DETECCIÓN DE CIUDADES - EJEMPLOS CRÍTICOS:
"ciudad juarez" → "Ciudad Juárez"
"nuevo laredo" → "Nuevo Laredo"
"tijuana" → "Tijuana"
"león" → "León"
"puebla" → "Puebla"
"mérida" → "Mérida"
"cancún" → "Cancún"
"gdl" o "guadalajara" → "Guadalajara"
"monterrey" o "mty" → "Monterrey"
"cdmx" o "df" o "la roma" o "polanco" o "condesa" → "CDMX"
"ciudad victoria" o "victoria" → "Ciudad Victoria"
"san miguel" o "san miguel de allende" → "San Miguel de Allende"

REGLA CRÍTICA: Si NO se menciona ciudad específica, SOLO entonces usa "CDMX" por defecto.

EJEMPLOS DE DETECCIÓN:
"un lugar tranqui en ciudad juarez" → {"vibe": "Tranqui", "city": "Ciudad Juárez"}
"algo para bellakear en tijuana" → {"vibe": "Bellakeo", "city": "Tijuana"}  
"café para chambear en león" → {"vibe": "Chambeador", "city": "León"}
"bar barbón en mérida" → {"vibe": "Barbón", "city": "Mérida"}
"lugar dominguero en ciudad victoria" → {"vibe": "Dominguero", "city": "Ciudad Victoria"}
"restaurante para dateo en san miguel" → {"vibe": "Dateo", "city": "San Miguel de Allende"}

RESPONDE SOLO CON JSON:
{"vibe": "nombre_exacto", "city": "nombre_ciudad_completo"}`
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

    // Try primary model first (o3-mini)
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
                content:
                  "Eres un experto en análisis de lenguaje coloquial mexicano. Responde únicamente con JSON válido, sin texto adicional.",
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

          if (parsed.vibe && parsed.city && validVibes.includes(parsed.vibe)) {
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

    // Try fallback model (gpt-4o-mini)
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
                content:
                  "Eres un experto en análisis de lenguaje coloquial mexicano. Responde únicamente con JSON válido, sin texto adicional.",
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

  // Enhanced city detection with more Mexican cities
  let city = "CDMX" // Default fallback

  const cityMappings = [
    { patterns: ["ciudad juarez", "juarez"], city: "Ciudad Juárez" },
    { patterns: ["nuevo laredo", "laredo"], city: "Nuevo Laredo" },
    { patterns: ["tijuana", "tj"], city: "Tijuana" },
    { patterns: ["león", "leon"], city: "León" },
    { patterns: ["puebla"], city: "Puebla" },
    { patterns: ["mérida", "merida"], city: "Mérida" },
    { patterns: ["cancún", "cancun"], city: "Cancún" },
    { patterns: ["gdl", "guadalajara", "zapopan"], city: "Guadalajara" },
    { patterns: ["mty", "monterrey", "san pedro"], city: "Monterrey" },
    { patterns: ["ciudad victoria", "victoria"], city: "Ciudad Victoria" },
    { patterns: ["san miguel", "san miguel de allende", "allende"], city: "San Miguel de Allende" },
    { patterns: ["polanco", "roma", "condesa", "santa fe", "cdmx", "df"], city: "CDMX" },
  ]

  for (const { patterns, city: mappedCity } of cityMappings) {
    if (patterns.some((pattern) => lowerQuery.includes(pattern))) {
      city = mappedCity
      break
    }
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
