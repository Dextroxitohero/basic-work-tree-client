import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiRequestError } from '@/api/errors'
import { notifyApiError } from '@/lib/notify'

/** Errores que ya tienen tratamiento propio en otro sitio, y no necesitan toast. */
function isHandledElsewhere(error: unknown): boolean {
  if (!(error instanceof ApiRequestError)) return false
  // 401: el interceptor cierra sesión o el formulario muestra las credenciales. 409/422: van al campo.
  // 429: solo ocurre en login y registro, que lo muestran con la cuenta atrás.
  return error.status === 401 || error.status === 409 || error.status === 422 || error.status === 429
}

function onError(error: unknown) {
  if (!isHandledElsewhere(error)) notifyApiError(error)
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError }),
  mutationCache: new MutationCache({ onError }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Solo se reintentan fallos del servidor; un 4xx no mejora reintentando.
      retry: (failures, error) =>
        error instanceof ApiRequestError && error.status >= 500 && failures < 2,
    },
  },
})
