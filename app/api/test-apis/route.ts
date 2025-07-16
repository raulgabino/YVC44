import { NextResponse } from "next/server"
import { testOpenAIConnection, testPerplexityConnection, getApiStatus, MODELS } from "@/lib/api-config"

export async function GET() {
  try {
    const apiStatus = getApiStatus()

    // Probar conexiones en paralelo
    const [openaiTest, perplexityTest] = await Promise.allSettled([testOpenAIConnection(), testPerplexityConnection()])

    const openaiConnection = openaiTest.status === "fulfilled" ? openaiTest.value : false
    const perplexityConnection = perplexityTest.status === "fulfilled" ? perplexityTest.value : false

    const overallStatus = apiStatus.openai.configured && openaiConnection ? "success" : "partial"

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      apis: {
        openai: {
          configured: apiStatus.openai.configured,
          connection: openaiConnection,
          keyLength: apiStatus.openai.keyLength,
          models: {
            primary: MODELS.OPENAI.PRIMARY,
            fallback: MODELS.OPENAI.FALLBACK,
          },
          error: openaiTest.status === "rejected" ? openaiTest.reason?.message : null,
        },
        perplexity: {
          configured: apiStatus.perplexity.configured,
          connection: perplexityConnection,
          keyLength: apiStatus.perplexity.keyLength,
          models: {
            primary: MODELS.PERPLEXITY.PRIMARY,
            fallback: MODELS.PERPLEXITY.FALLBACK,
          },
          error: perplexityTest.status === "rejected" ? perplexityTest.reason?.message : null,
        },
      },
      recommendations: generateRecommendations(apiStatus, openaiConnection, perplexityConnection),
    })
  } catch (error) {
    console.error("API test error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Error testing API configurations",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

function generateRecommendations(
  apiStatus: ReturnType<typeof getApiStatus>,
  openaiConnection: boolean,
  perplexityConnection: boolean,
): string[] {
  const recommendations: string[] = []

  if (!apiStatus.openai.configured) {
    recommendations.push("Configura OPENAI_API_KEY para habilitar la detección de vibes con IA")
  } else if (!openaiConnection) {
    recommendations.push("Verifica que tu API key de OpenAI sea válida y tenga créditos disponibles")
  }

  if (!apiStatus.perplexity.configured) {
    recommendations.push("Configura PERPLEXITY_API_KEY para habilitar búsquedas web inteligentes")
  } else if (!perplexityConnection) {
    recommendations.push("Verifica que tu API key de Perplexity sea válida")
  }

  if (apiStatus.openai.configured && openaiConnection && apiStatus.perplexity.configured && perplexityConnection) {
    recommendations.push("¡Todas las APIs están configuradas correctamente! 🎉")
  }

  if (!apiStatus.openai.configured && !apiStatus.perplexity.configured) {
    recommendations.push("El sistema funcionará solo con análisis manual de keywords")
  }

  return recommendations
}
