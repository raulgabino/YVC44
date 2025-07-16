"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Zap, Shield, Globe, Brain } from "lucide-react"

interface ApiStatusData {
  status: "success" | "partial" | "error"
  timestamp: string
  apis: {
    openai: {
      configured: boolean
      connection: boolean
      keyLength: number
      models: {
        primary: string
        fallback: string
      }
      error?: string | null
    }
    perplexity: {
      configured: boolean
      connection: boolean
      keyLength: number
      models: {
        primary: string
        fallback: string
      }
      error?: string | null
    }
  }
  recommendations: string[]
}

export function ApiStatus() {
  const [status, setStatus] = useState<ApiStatusData | null>(null)
  const [loading, setLoading] = useState(false)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-apis")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      setStatus({
        status: "error",
        timestamp: new Date().toISOString(),
        apis: {
          openai: {
            configured: false,
            connection: false,
            keyLength: 0,
            models: { primary: "", fallback: "" },
            error: "Error checking status",
          },
          perplexity: {
            configured: false,
            connection: false,
            keyLength: 0,
            models: { primary: "", fallback: "" },
            error: "Error checking status",
          },
        },
        recommendations: ["Error al verificar el estado de las APIs"],
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  if (!status) return null

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="h-4 w-4 animate-spin" />
    if (status.status === "success") return <CheckCircle className="h-4 w-4 text-green-600" />
    if (status.status === "partial") return <AlertCircle className="h-4 w-4 text-yellow-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusColor = () => {
    if (status.status === "success") return "text-green-600"
    if (status.status === "partial") return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusText = () => {
    if (status.status === "success") return "Todas las APIs funcionando"
    if (status.status === "partial") return "Funcionamiento parcial"
    return "APIs no configuradas"
  }

  return (
    <Card className="mb-6 max-w-4xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {getStatusIcon()}
          Estado de las APIs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Estado general */}
          <div className="flex items-center justify-between p-4 bg-accent/20 rounded-lg">
            <span className="font-medium">Estado general:</span>
            <Badge
              variant={
                status.status === "success" ? "default" : status.status === "partial" ? "secondary" : "destructive"
              }
            >
              {getStatusText()}
            </Badge>
          </div>

          {/* APIs individuales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OpenAI */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                <h3 className="font-semibold">OpenAI (Detección de Vibes)</h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>API Key:</span>
                  <Badge variant={status.apis.openai.configured ? "default" : "destructive"}>
                    {status.apis.openai.configured
                      ? `Configurada (${status.apis.openai.keyLength} chars)`
                      : "No configurada"}
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span>Conexión:</span>
                  <Badge variant={status.apis.openai.connection ? "default" : "destructive"}>
                    {status.apis.openai.connection ? "Activa" : "Inactiva"}
                  </Badge>
                </div>

                {status.apis.openai.models.primary && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span>Modelo principal:</span>
                      <div className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        <Badge variant="outline" className="text-xs">
                          {status.apis.openai.models.primary}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Modelo fallback:</span>
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        <Badge variant="outline" className="text-xs">
                          {status.apis.openai.models.fallback}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {status.apis.openai.error && (
                  <div className="text-xs text-red-600 bg-red-50 p-2 rounded">Error: {status.apis.openai.error}</div>
                )}
              </div>
            </div>

            {/* Perplexity */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                <h3 className="font-semibold">Perplexity (Búsquedas Web)</h3>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>API Key:</span>
                  <Badge variant={status.apis.perplexity.configured ? "default" : "secondary"}>
                    {status.apis.perplexity.configured
                      ? `Configurada (${status.apis.perplexity.keyLength} chars)`
                      : "Opcional"}
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span>Conexión:</span>
                  <Badge variant={status.apis.perplexity.connection ? "default" : "secondary"}>
                    {status.apis.perplexity.connection
                      ? "Activa"
                      : status.apis.perplexity.configured
                        ? "Inactiva"
                        : "No configurada"}
                  </Badge>
                </div>

                {status.apis.perplexity.models.primary && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span>Modelo principal:</span>
                      <Badge variant="outline" className="text-xs">
                        {status.apis.perplexity.models.primary.split("-").slice(0, 2).join("-")}
                      </Badge>
                    </div>
                  </div>
                )}

                {status.apis.perplexity.error && (
                  <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                    Error: {status.apis.perplexity.error}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recomendaciones */}
          {status.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Recomendaciones:</h4>
              <ul className="space-y-1">
                {status.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Información adicional */}
          <div className="pt-2 border-t text-xs text-muted-foreground">
            <p>Última verificación: {new Date(status.timestamp).toLocaleString()}</p>
            <p className="mt-1">
              💡 <strong>Tip:</strong> OpenAI es esencial para la detección de vibes. Perplexity mejora los resultados
              de búsqueda pero es opcional.
            </p>
          </div>

          <Button
            onClick={checkStatus}
            disabled={loading}
            variant="outline"
            size="sm"
            className="w-full bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Verificar estado
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
