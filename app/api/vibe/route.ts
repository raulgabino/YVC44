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

    // Try AI analysis first (o3-mini)
    try {
      const completion = await openai.chat.completions.create({
        model: "o3-mini",
        messages: [
          {
            role: "system",
            content: `Eres un experto en análisis de vibes y ciudades mexicanas.
            Analiza la consulta del usuario y extrae:
            1. VIBE: El estado de ánimo/vibra (Tranqui, Barbón, Bohemio, etc.)
            2. CIUDAD: La ciudad específica mencionada
            
            IMPORTANTE: Si NO se menciona una ciudad específica, devuelve "unknown" para ciudad.
            NO asumas ni agregues ciudades por defecto.
            
            Responde SOLO en formato JSON:
            {"vibe": "vibe_detectado", "city": "ciudad_detectada_o_unknown"}`,
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
        return NextResponse.json(parsed)
      }
    } catch (aiError) {
      console.warn("o3-mini failed, trying gpt-4o-mini:", aiError)

      // Fallback to gpt-4o-mini
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Analiza la consulta y extrae vibe y ciudad.
              Si NO se menciona ciudad, devuelve "unknown" para ciudad.
              Formato JSON: {"vibe": "vibe", "city": "ciudad_o_unknown"}`,
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
          return NextResponse.json(parsed)
        }
      } catch (gptError) {
        console.warn("GPT-4o-mini failed, using manual analysis:", gptError)
      }
    }

    // Manual fallback analysis (NO CDMX default)
    const manualResult = analyzeQueryManually(query)
    return NextResponse.json(manualResult)
  } catch (error) {
    console.error("Error in vibe analysis:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function analyzeQueryManually(query: string): { vibe: string; city: string } {
  const lowerQuery = query.toLowerCase()

  // NO DEFAULT CITY - Let the system handle missing cities
  let city = "unknown" // Changed from "CDMX" to "unknown"

  // Extensive city mappings
  const cityMappings = [
    { patterns: ["ciudad juarez", "juarez"], city: "Ciudad Juárez" },
    { patterns: ["nuevo laredo", "laredo"], city: "Nuevo Laredo" },
    { patterns: ["tijuana", "tj"], city: "Tijuana" },
    { patterns: ["mexicali"], city: "Mexicali" },
    { patterns: ["ensenada"], city: "Ensenada" },
    { patterns: ["chihuahua"], city: "Chihuahua" },
    { patterns: ["hermosillo"], city: "Hermosillo" },
    { patterns: ["culiacan", "culiacán"], city: "Culiacán" },
    { patterns: ["mazatlan", "mazatlán"], city: "Mazatlán" },
    { patterns: ["durango"], city: "Durango" },
    { patterns: ["saltillo"], city: "Saltillo" },
    { patterns: ["torreon", "torreón"], city: "Torreón" },
    { patterns: ["monclova"], city: "Monclova" },
    { patterns: ["reynosa"], city: "Reynosa" },
    { patterns: ["matamoros"], city: "Matamoros" },
    { patterns: ["tampico"], city: "Tampico" },
    { patterns: ["ciudad victoria", "victoria"], city: "Ciudad Victoria" },
    { patterns: ["monterrey", "mty"], city: "Monterrey" },
    { patterns: ["guadalupe"], city: "Guadalupe" },
    { patterns: ["san nicolas", "san nicolás"], city: "San Nicolás de los Garza" },
    { patterns: ["zacatecas"], city: "Zacatecas" },
    { patterns: ["aguascalientes"], city: "Aguascalientes" },
    { patterns: ["san luis potosi", "san luis potosí", "slp"], city: "San Luis Potosí" },
    { patterns: ["queretaro", "querétaro"], city: "Querétaro" },
    { patterns: ["leon", "león"], city: "León" },
    { patterns: ["irapuato"], city: "Irapuato" },
    { patterns: ["celaya"], city: "Celaya" },
    { patterns: ["salamanca"], city: "Salamanca" },
    { patterns: ["guadalajara", "gdl"], city: "Guadalajara" },
    { patterns: ["zapopan"], city: "Zapopan" },
    { patterns: ["tlaquepaque"], city: "Tlaquepaque" },
    { patterns: ["tonala", "tonalá"], city: "Tonalá" },
    { patterns: ["puerto vallarta", "vallarta"], city: "Puerto Vallarta" },
    { patterns: ["colima"], city: "Colima" },
    { patterns: ["manzanillo"], city: "Manzanillo" },
    { patterns: ["morelia"], city: "Morelia" },
    { patterns: ["uruapan"], city: "Uruapan" },
    { patterns: ["toluca"], city: "Toluca" },
    { patterns: ["naucalpan"], city: "Naucalpan" },
    { patterns: ["tlalnepantla"], city: "Tlalnepantla" },
    { patterns: ["ecatepec"], city: "Ecatepec" },
    { patterns: ["nezahualcoyotl", "nezahualcóyotl", "neza"], city: "Nezahualcóyotl" },
    { patterns: ["cuernavaca"], city: "Cuernavaca" },
    { patterns: ["jiutepec"], city: "Jiutepec" },
    { patterns: ["temixco"], city: "Temixco" },
    { patterns: ["pachuca"], city: "Pachuca" },
    { patterns: ["tulancingo"], city: "Tulancingo" },
    { patterns: ["tlaxcala"], city: "Tlaxcala" },
    { patterns: ["apizaco"], city: "Apizaco" },
    { patterns: ["puebla"], city: "Puebla" },
    { patterns: ["tehuacan", "tehuacán"], city: "Tehuacán" },
    { patterns: ["san martin", "san martín"], city: "San Martín Texmelucan" },
    { patterns: ["veracruz"], city: "Veracruz" },
    { patterns: ["xalapa"], city: "Xalapa" },
    { patterns: ["coatzacoalcos"], city: "Coatzacoalcos" },
    { patterns: ["poza rica"], city: "Poza Rica" },
    { patterns: ["orizaba"], city: "Orizaba" },
    { patterns: ["tuxtla gutierrez", "tuxtla gutiérrez"], city: "Tuxtla Gutiérrez" },
    { patterns: ["san cristobal", "san cristóbal"], city: "San Cristóbal de las Casas" },
    { patterns: ["tapachula"], city: "Tapachula" },
    { patterns: ["villahermosa"], city: "Villahermosa" },
    { patterns: ["cardenas", "cárdenas"], city: "Cárdenas" },
    { patterns: ["comalcalco"], city: "Comalcalco" },
    { patterns: ["campeche"], city: "Campeche" },
    { patterns: ["ciudad del carmen"], city: "Ciudad del Carmen" },
    { patterns: ["merida", "mérida"], city: "Mérida" },
    { patterns: ["cancun", "cancún"], city: "Cancún" },
    { patterns: ["playa del carmen"], city: "Playa del Carmen" },
    { patterns: ["cozumel"], city: "Cozumel" },
    { patterns: ["chetumal"], city: "Chetumal" },
    { patterns: ["oaxaca"], city: "Oaxaca" },
    { patterns: ["salina cruz"], city: "Salina Cruz" },
    { patterns: ["juchitan", "juchitán"], city: "Juchitán" },
    { patterns: ["acapulco"], city: "Acapulco" },
    { patterns: ["chilpancingo"], city: "Chilpancingo" },
    { patterns: ["iguala"], city: "Iguala" },
    { patterns: ["zihuatanejo"], city: "Zihuatanejo" },
    // CDMX and neighborhoods
    { patterns: ["cdmx", "ciudad de mexico", "ciudad de méxico", "mexico city", "df"], city: "CDMX" },
    { patterns: ["polanco"], city: "CDMX" },
    { patterns: ["roma norte", "roma"], city: "CDMX" },
    { patterns: ["condesa"], city: "CDMX" },
    { patterns: ["coyoacan", "coyoacán"], city: "CDMX" },
    { patterns: ["san angel", "san ángel"], city: "CDMX" },
    { patterns: ["xochimilco"], city: "CDMX" },
    { patterns: ["santa fe"], city: "CDMX" },
    { patterns: ["del valle"], city: "CDMX" },
    { patterns: ["doctores"], city: "CDMX" },
    { patterns: ["centro historico", "centro histórico", "zocalo", "zócalo"], city: "CDMX" },
    // Special locations
    { patterns: ["san miguel de allende", "san miguel"], city: "San Miguel de Allende" },
    { patterns: ["valle de bravo"], city: "Valle de Bravo" },
    { patterns: ["taxco"], city: "Taxco" },
    { patterns: ["tepoztlan", "tepoztlán"], city: "Tepoztlán" },
    { patterns: ["rosarito"], city: "Rosarito" },
    { patterns: ["la paz"], city: "La Paz" },
    { patterns: ["los cabos", "cabo"], city: "Los Cabos" },
  ]

  // City detection
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
  let vibe = "Tranqui" // Default vibe

  const vibePatterns = [
    { vibe: "Bellakeo", keywords: ["bellak", "bellaque", "ligar", "fiesta", "party", "noche", "drinks"] },
    { vibe: "Barbón", keywords: ["barbón", "fresa", "elegante", "fino", "luxury", "caro", "exclusivo"] },
    { vibe: "Familia", keywords: ["familia", "niños", "kids", "familiar", "family"] },
    { vibe: "Bohemio", keywords: ["bohemio", "alternativo", "indie", "underground", "artista"] },
    { vibe: "Experimental", keywords: ["experimental", "fusion", "innovador", "molecular", "avant"] },
    { vibe: "Intelectual", keywords: ["libro", "libreria", "biblioteca", "leer", "cultural", "arte"] },
    { vibe: "Hipster", keywords: ["hipster", "trendy", "cool", "moderno", "specialty", "artesanal"] },
    { vibe: "Romántico", keywords: ["romantico", "romántico", "cita", "date", "pareja", "couple"] },
    { vibe: "Wellness", keywords: ["wellness", "saludable", "healthy", "vegan", "organic", "spa"] },
    { vibe: "Nostálgico", keywords: ["nostalgia", "vintage", "retro", "clasico", "clásico", "tradicional"] },
    { vibe: "Deportivo", keywords: ["deportes", "sports", "futbol", "fútbol", "bar deportivo"] },
    { vibe: "Tranqui", keywords: ["tranquilo", "quiet", "peaceful", "relajado", "calm", "cafe"] },
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
