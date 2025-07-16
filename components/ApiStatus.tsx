"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Zap, Shield } from "lucide-react"

interface ApiStatusData {
  status: "success" | "error"
  message: string
  hasApiKey: boolean
  connection: boolean
  models?: {
    primary: string
    fallback: string
  }
  timestamp?: string
}

export function ApiStatus() {
  const [status, setStatus] = useState<ApiStatusData | null>(null)
  const [loading, setLoading] = useState(false)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/test-openai")
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      setStatus({
        status: "error",
        message: "Error checking API status",
        hasApiKey: false,
        connection: false,
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
    if (status.hasApiKey && !status.connection) return <AlertCircle className="h-4 w-4 text-yellow-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusColor = () => {
    if (status.status === "success") return "text-green-600"
    if (status.hasApiKey && !status.connection) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <Card className="mb-6 max-w-2xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {getStatusIcon()}
          Estado de la API OpenAI
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Estado general:</span>
            <Badge variant={status.status === "success" ? "default" : "destructive"}>
              {status.status === "success" ? "Funcionando" : "Error"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">API Key configurada:</span>
            <Badge variant={status.hasApiKey ? "default" : "destructive"}>{status.hasApiKey ? "Sí" : "No"}</Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Conexión activa:</span>
            <Badge variant={status.connection ? "default" : "destructive"}>
              {status.connection ? "Conectado" : "Desconectado"}
            </Badge>
          </div>

          {status.models && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Modelo principal:</span>
                <div className="flex items-center gap-2">
                  <Zap className="h-3 w-3" />
                  <Badge variant="outline">{status.models.primary}</Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Modelo fallback:</span>
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  <Badge variant="outline">{status.models.fallback}</Badge>
                </div>
              </div>
            </div>
          )}

          <div className="pt-2 border-t">
            <p className={`text-sm ${getStatusColor()}`}>{status.message}</p>
            {status.timestamp && (
              <p className="text-xs text-muted-foreground mt-1">
                Última verificación: {new Date(status.timestamp).toLocaleString()}
              </p>
            )}
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
