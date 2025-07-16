import { NextResponse } from "next/server"
import { testOpenAIConnection, MODELS } from "@/lib/openai"

export async function GET() {
  try {
    // Verificar variables de entorno
    const hasApiKey = !!process.env.OPENAI_API_KEY

    if (!hasApiKey) {
      return NextResponse.json(
        {
          status: "error",
          message: "OPENAI_API_KEY not found in environment variables",
          hasApiKey: false,
          connection: false,
          models: MODELS,
        },
        { status: 500 },
      )
    }

    // Probar conexión
    const connectionTest = await testOpenAIConnection()

    return NextResponse.json({
      status: connectionTest ? "success" : "error",
      message: connectionTest ? "OpenAI API configured correctly" : "OpenAI API connection failed",
      hasApiKey: true,
      connection: connectionTest,
      models: {
        primary: MODELS.PRIMARY,
        fallback: MODELS.FALLBACK,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("OpenAI test error:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Error testing OpenAI configuration",
        error: error instanceof Error ? error.message : "Unknown error",
        hasApiKey: !!process.env.OPENAI_API_KEY,
        connection: false,
      },
      { status: 500 },
    )
  }
}
