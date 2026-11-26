import axios, { AxiosError } from 'axios'
import { config } from '@/config'
import { ApiRequestError } from './errors'
import type { ApiError } from './types'

type TokenGetter = () => string | null | Promise<string | null>

let getToken: TokenGetter = () => null
let onUnauthorized: () => void = () => {}
let unauthorizedHandled = false

/** El módulo de auth registra aquí cómo obtener el token y qué hacer ante un 401. */
export function configureApiAuth(options: { getToken: TokenGetter; onUnauthorized: () => void }) {
  getToken = options.getToken
  onUnauthorized = options.onUnauthorized
  unauthorizedHandled = false
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

    const apiError = ApiRequestError.fromBody(
      error.response.status,
      error.response.data as Partial<ApiError> | undefined,
    )

    // Varias peticiones pueden fallar a la vez con 401: se cierra la sesión una sola vez.
    if (apiError.status === 401 && !unauthorizedHandled) {
      unauthorizedHandled = true
      onUnauthorized()
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
