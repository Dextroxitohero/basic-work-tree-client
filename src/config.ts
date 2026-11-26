export const config = {
  // Vacío en desarrollo: el proxy de Vite reenvía /api a la API y evita CORS.
  apiBaseUrl: `${import.meta.env.VITE_API_URL ?? ''}/api/v1`,
} as const
