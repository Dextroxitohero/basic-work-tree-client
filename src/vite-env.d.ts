/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Bandera: a qué API habla el cliente. */
  readonly VITE_API_TARGET?: 'local' | 'production'
  readonly VITE_API_URL_LOCAL?: string
  readonly VITE_API_URL_PRODUCTION?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
