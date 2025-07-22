import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not found, using manual analysis")
      const manualResult = analyzeQueryManually(query)
      return NextResponse.json({
        vibe: manualResult.vibe,
        city: manualResult.city,
        confidence: 0.75,
      })
    }

    // Try AI analysis first (gpt-4o-mini as fallback)
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Eres un experto en análisis de vibes y ciudades mexicanas.
            Analiza la consulta del usuario y extrae:
            1. VIBE: El estado de ánimo/vibra (chill, party, romantic, work, food, drinks, culture, sport, shopping, nature)
            2. CIUDAD: La ciudad específica mencionada
            3. CONFIDENCE: Nivel de confianza en el análisis (0.0 a 1.0)
            
            IMPORTANTE: Si NO se menciona una ciudad específica, devuelve "unknown" para ciudad.
            NO asumas ni agregues ciudades por defecto.
            
            Responde SOLO en formato JSON:
            {"vibe": "vibe_detectado", "city": "ciudad_detectada_o_unknown", "confidence": 0.85}`,
          },
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: 100,
        temperature: 0.1,
      })

      const aiResult = completion.choices[0]?.message?.content
      if (aiResult) {
        const parsed = JSON.parse(aiResult)
        return NextResponse.json({
          vibe: parsed.vibe,
          city: parsed.city,
          confidence: parsed.confidence || 0.8,
        })
      }
    } catch (aiError) {
      console.warn("OpenAI API failed, using manual analysis:", aiError)
    }

    // Manual fallback analysis
    const manualResult = analyzeQueryManually(query)
    return NextResponse.json({
      vibe: manualResult.vibe,
      city: manualResult.city,
      confidence: 0.75, // Manual analysis gets lower confidence
    })
  } catch (error) {
    console.error("Error in vibe analysis:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function analyzeQueryManually(query: string): { vibe: string; city: string } {
  const lowerQuery = query.toLowerCase()

  // NO DEFAULT CITY - Let the system handle missing cities
  let city = "unknown"

  // City detection
  const cityMappings = [
    { patterns: ["cdmx", "ciudad de mexico", "ciudad de méxico", "mexico city", "df"], city: "CDMX" },
    { patterns: ["guadalajara", "gdl"], city: "Guadalajara" },
    { patterns: ["monterrey", "mty"], city: "Monterrey" },
    { patterns: ["tijuana", "tj"], city: "Tijuana" },
    { patterns: ["puebla"], city: "Puebla" },
    { patterns: ["cancun", "cancún"], city: "Cancún" },
    { patterns: ["merida", "mérida"], city: "Mérida" },
    { patterns: ["oaxaca"], city: "Oaxaca" },
    { patterns: ["san miguel de allende", "san miguel"], city: "San Miguel de Allende" },
  ]

  for (const mapping of cityMappings) {
    for (const pattern of mapping.patterns) {
      if (lowerQuery.includes(pattern)) {
        city = mapping.city
        break
      }
    }
    if (city !== "unknown") break
  }

  // Vibe detection with priority order
  let vibe = "chill" // Default vibe

  const vibePatterns = [
    { vibe: "party", keywords: ["fiesta", "party", "noche", "drinks", "antro", "bar", "bailar"] },
    { vibe: "romantic", keywords: ["romantico", "romántico", "cita", "date", "pareja", "couple"] },
    { vibe: "work", keywords: ["trabajo", "trabajar", "oficina", "productivo", "wifi", "laptop"] },
    { vibe: "food", keywords: ["comida", "comer", "hambre", "restaurante", "tacos", "desayuno", "almuerzo", "cena"] },
    { vibe: "drinks", keywords: ["bebidas", "café", "coffee", "cerveza", "vino", "cocktail", "bar"] },
    { vibe: "culture", keywords: ["cultura", "museo", "arte", "galeria", "exposición", "teatro"] },
    { vibe: "sport", keywords: ["deporte", "futbol", "fútbol", "gym", "ejercicio", "correr"] },
    { vibe: "shopping", keywords: ["compras", "shopping", "tienda", "boutique", "mall", "centro comercial"] },
    { vibe: "nature", keywords: ["naturaleza", "parque", "aire libre", "verde", "plantas", "jardín"] },
    { vibe: "chill", keywords: ["relajar", "tranquilo", "quiet", "peaceful", "calm", "descansar"] },
  ]

  // Find matching vibe (first match wins due to priority order)
  for (const pattern of vibePatterns) {
    if (pattern.keywords.some((keyword) => lowerQuery.includes(keyword))) {
      vibe = pattern.vibe
      break
    }
  }

  return { vibe, city }
}
