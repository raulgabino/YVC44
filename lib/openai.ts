import OpenAI from "openai"

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is required but not found in environment variables")
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Configuración de modelos disponibles
export const MODELS = {
  PRIMARY: "o3-mini",
  FALLBACK: "gpt-4o-mini",
} as const

// Configuración de parámetros por modelo
export const MODEL_CONFIGS = {
  "o3-mini": {
    temperature: 0.1,
    max_tokens: 150,
    top_p: 0.9,
  },
  "gpt-4o-mini": {
    temperature: 0.2,
    max_tokens: 100,
    top_p: 0.95,
  },
} as const

// Función helper para verificar la conexión
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    const response = await openai.chat.completions.create({
      model: MODELS.FALLBACK, // Usar fallback para test ya que es más confiable
      messages: [{ role: "user", content: "Test connection" }],
      max_tokens: 5,
    })
    return !!response.choices[0]?.message?.content
  } catch (error) {
    console.error("OpenAI connection test failed:", error)
    return false
  }
}
