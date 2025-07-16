"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ErrorMessageProps {
  message: string
  onRetry?: () => void
  retryText?: string
}

export function ErrorMessage({ message, onRetry, retryText = "Intentar de nuevo" }: ErrorMessageProps) {
  return (
    <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="ml-4 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground bg-transparent"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {retryText}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
