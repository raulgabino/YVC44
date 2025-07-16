# Configuración de OpenAI para YCV Playlists

## 📋 Requisitos

1. Cuenta de OpenAI con acceso a la API
2. API Key de OpenAI con créditos disponibles
3. Acceso a los modelos `o3-mini` y `gpt-4o-mini`

## 🔧 Configuración

### 1. Obtener API Key de OpenAI

1. Ve a [OpenAI Platform](https://platform.openai.com/)
2. Inicia sesión o crea una cuenta
3. Ve a "API Keys" en el dashboard
4. Crea una nueva API key
5. Copia la key (empieza con `sk-proj-...`)

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

\`\`\`env
OPENAI_API_KEY=sk-proj-tu-api-key-aqui
\`\`\`

### 3. Verificar Configuración

1. Inicia el servidor de desarrollo:
\`\`\`bash
npm run dev
\`\`\`

2. Ve a `http://localhost:3000/api/test-openai` para verificar la configuración

3. O usa el componente ApiStatus en tu aplicación

## 🤖 Modelos Configurados

- **Modelo Principal**: `o3-mini` - Rápido y eficiente para análisis de vibes
- **Modelo Fallback**: `gpt-4o-mini` - Confiable como respaldo
- **Análisis Manual**: Sistema de keywords como último recurso

## 🔍 Verificación de Estado

El proyecto incluye herramientas para verificar el estado de la API:

- **Endpoint**: `/api/test-openai` - Prueba la conexión
- **Componente**: `<ApiStatus />` - Muestra el estado en la UI

## 🚨 Solución de Problemas

### Error: "OPENAI_API_KEY not found"
- Verifica que el archivo `.env.local` existe
- Confirma que la variable está correctamente escrita
- Reinicia el servidor de desarrollo

### Error: "OpenAI API connection failed"
- Verifica que tu API key es válida
- Confirma que tienes créditos disponibles
- Revisa que tienes acceso a los modelos configurados

### Error: "Model not found"
- Algunos modelos pueden no estar disponibles en todas las cuentas
- El sistema automáticamente usará el fallback manual

## 💡 Consejos

1. **Seguridad**: Nunca commits tu API key al repositorio
2. **Costos**: Monitorea el uso en el dashboard de OpenAI
3. **Límites**: Respeta los rate limits de la API
4. **Testing**: Usa el endpoint de prueba regularmente

## 📊 Monitoreo

El sistema registra:
- Qué modelo procesó cada request
- Nivel de confianza de cada respuesta
- Errores y fallbacks utilizados

Revisa los logs para optimizar el rendimiento.
