type ApiTarget = 'local' | 'production'

function readTarget(): ApiTarget {
  const value = import.meta.env.VITE_API_TARGET ?? 'production'
  if (value !== 'local' && value !== 'production') {
    throw new Error(`VITE_API_TARGET inválido: "${value}" (usa "local" o "production")`)
  }
  return value
}

const apiTarget = readTarget()

const apiUrl =
  (apiTarget === 'local' ? import.meta.env.VITE_API_URL_LOCAL : import.meta.env.VITE_API_URL_PRODUCTION) ?? ''

// Un build sin la URL de la API elegida llamaría a su propio dominio y fallaría con 405.
if (!import.meta.env.DEV && apiUrl === '') {
  throw new Error(`Falta VITE_API_URL_${apiTarget.toUpperCase()} en .env`)
}

export const config = {
  /** Qué API elige la bandera. */
  apiTarget,
  // Desarrollo: ruta relativa; el proxy de Vite la reenvía a la API elegida (evita CORS).
  // Build: URL absoluta de la API elegida (su CORS debe permitir el origen del front).
  apiBaseUrl: import.meta.env.DEV ? '/api/v1' : `${apiUrl.replace(/\/+$/, '')}/api/v1`,
} as const
