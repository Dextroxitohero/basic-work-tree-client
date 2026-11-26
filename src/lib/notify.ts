import { sileo } from 'sileo'
import { ApiRequestError } from '@/api/errors'

// Único punto de contacto con Sileo: si se cambia de librería, solo se toca este archivo.

export const notify = {
  success: (title: string, description?: string) => sileo.success({ title, description }),
  error: (title: string, description?: string) => sileo.error({ title, description }),
  info: (title: string, description?: string) => sileo.info({ title, description }),
  warning: (title: string, description?: string) => sileo.warning({ title, description }),
  promise: <T>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error?: string },
  ) =>
    sileo.promise(promise, {
      loading: { title: messages.loading },
      success: { title: messages.success },
      error: (err) => ({
        title: messages.error ?? 'No se pudo completar la operación',
        description: err instanceof Error ? err.message : undefined,
      }),
    }),
}

const TITLES: Record<string, string> = {
  insufficient_permissions: 'No tienes permiso para esta acción',
  auth_provider_unavailable: 'Servicio de autenticación no disponible',
  network_error: 'Sin conexión con el servidor',
  internal_error: 'Error interno del servidor',
}

/** Toast para errores transversales (los de campo se muestran en el formulario). */
export function notifyApiError(error: unknown) {
  if (error instanceof ApiRequestError) {
    notify.error(TITLES[error.code] ?? 'Algo salió mal', error.message)
  } else {
    notify.error('Algo salió mal')
  }
}
