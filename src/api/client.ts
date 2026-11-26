import axios, { AxiosError } from 'axios'
import { config } from '@/config'
import { ApiRequestError } from './errors'
import type { ApiError } from './types'

type TokenGetter = () => string | null | Promise<string | null>

let getToken: TokenGetter = () => null
let onUnauthorized: () => void = () => {}
/** Último token que ya provocó un cierre de sesión: evita repetirlo si fallan varias peticiones a la vez. */
let lastRejectedAuth: string | null = null

/** El módulo de auth registra aquí cómo obtener el token y qué hacer ante un 401. */
export function configureApiAuth(options: { getToken: TokenGetter; onUnauthorized: () => void }) {
  getToken = options.getToken
  onUnauthorized = options.onUnauthorized
  lastRejectedAuth = null
}

export const http = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use(async (request) => {
  const token = await getToken()
  if (token) request.headers.set('Authorization', `Bearer ${token}`)
  return request
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!(error instanceof AxiosError)) throw error
    if (!error.response) throw ApiRequestError.network()

    const retryAfter = Number(error.response.headers['retry-after'])
    const apiError = ApiRequestError.fromBody(
      error.response.status,
      error.response.data as Partial<ApiError> | undefined,
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
    )

    // Solo `invalid_token` cierra la sesión. Un 401 `invalid_credentials` del login se muestra en
    // el formulario. Si varias peticiones fallan a la vez con el mismo token, se cierra una vez.
    if (apiError.status === 401 && apiError.code === 'invalid_token') {
      const sent = String(error.config?.headers?.Authorization ?? '')
      if (sent !== lastRejectedAuth) {
        lastRejectedAuth = sent
        onUnauthorized()
      }
    }
    throw apiError
  },
)

/** Quita claves con valor undefined/'' para no enviarlas como query params. */
export function cleanParams<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ''),
  ) as Partial<T>
}
