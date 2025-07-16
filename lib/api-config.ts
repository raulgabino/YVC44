import OpenAI from "openai"

// Verificar variables de entorno requeridas
const requiredEnvVars = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
}

// OpenAI Configuration
export const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  : null

// Modelos disponibles
export const MODELS = {
  OPENAI: {
    PRIMARY: "o3-mini",
    FALLBACK: "gpt-4o-mini",
  },
  PERPLEXITY: {
    PRIMARY: "llama-3.1-sonar-small-128k-online",
    FALLBACK: "llama-3.1-sonar-huge-128k-online",
  },
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
  "llama-3.1-sonar-small-128k-online": {
    temperature: 0.3,
    max_tokens: 1000,
    top_p: 0.9,
    search_domain_filter: ["mexico"],
    return_images: false,
    return_related_questions: false,
    search_recency_filter: "month",
  },
} as const

// Función para verificar configuración de APIs
export function getApiStatus() {
  return {
    openai: {
      configured: !!requiredEnvVars.OPENAI_API_KEY,
      keyLength: requiredEnvVars.OPENAI_API_KEY?.length || 0,
    },
    perplexity: {
      configured: !!requiredEnvVars.PERPLEXITY_API_KEY,
      keyLength: requiredEnvVars.PERPLEXITY_API_KEY?.length || 0,
    },
  }
}

// Función helper para llamadas a Perplexity
export async function callPerplexityAPI(
  messages: Array<{ role: string; content: string }>,
  model: string = MODELS.PERPLEXITY.PRIMARY,
) {
  if (!requiredEnvVars.PERPLEXITY_API_KEY) {
    throw new Error("PERPLEXITY_API_KEY not configured")
  }

  const config = MODEL_CONFIGS[model as keyof typeof MODEL_CONFIGS] || {}

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requiredEnvVars.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      ...config,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(`Perplexity API error: ${response.status} - ${JSON.stringify(errorData)}`)
  }

  return response.json()
}

// Función helper para verificar conexión OpenAI
export async function testOpenAIConnection(): Promise<boolean> {
  if (!openai) return false

  try {
    const response = await openai.chat.completions.create({
      model: MODELS.OPENAI.FALLBACK,
      messages: [{ role: "user", content: "Test connection" }],
      max_tokens: 5,
    })
    return !!response.choices[0]?.message?.content
  } catch (error) {
    console.error("OpenAI connection test failed:", error)
    return false
  }
}

// Función helper para verificar conexión Perplexity
export async function testPerplexityConnection(): Promise<boolean> {
  try {
    const response = await callPerplexityAPI(
      [{ role: "user", content: "Test: ¿Cuál es un buen restaurante en Ciudad de México?" }],
      MODELS.PERPLEXITY.PRIMARY,
    )
    return !!response.choices[0]?.message?.content
  } catch (error) {
    console.error("Perplexity connection test failed:", error)
    return false
  }
}
