import type { ApiError } from './types'

export interface ValidationDetail {
  loc: (string | number)[]
  msg: string
  type: string
}

/** Cualquier fallo de red o de la API, normalizado. */
export class ApiRequestError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.details = details
  }

  static fromBody(status: number, body: Partial<ApiError> | undefined): ApiRequestError {
    return new ApiRequestError(
      status,
      body?.error ?? 'http_error',
      body?.message ?? 'Error inesperado',
      body?.details,
    )
  }

  static network(): ApiRequestError {
    return new ApiRequestError(0, 'network_error', 'No se pudo conectar con el servidor')
  }

  /** Errores de validación del servidor (422), listos para mapear a campos de formulario. */
  get validation(): ValidationDetail[] {
    return this.code === 'validation_error' && Array.isArray(this.details)
      ? (this.details as ValidationDetail[])
      : []
  }
}

export function isApiError(error: unknown, code?: string): error is ApiRequestError {
  return error instanceof ApiRequestError && (code === undefined || error.code === code)
}
