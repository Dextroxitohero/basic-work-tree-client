import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Las variables del sistema (p. ej. las de Railway) tienen prioridad sobre los .env.
  const env = loadEnv(mode, process.cwd(), '')
  const flag = env.VITE_API_TARGET ?? 'production'
  if (flag !== 'local' && flag !== 'production') {
    throw new Error(`VITE_API_TARGET inválido: "${flag}" (usa "local" o "production")`)
  }
  const target = flag === 'local' ? env.VITE_API_URL_LOCAL : env.VITE_API_URL_PRODUCTION
  if (!target) throw new Error(`Falta VITE_API_URL_${flag.toUpperCase()} en .env`)

  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
    server: {
      // Evita CORS en desarrollo: el navegador habla con el mismo origen y Vite reenvía a la API elegida.
      proxy: { '/api': { target, changeOrigin: true } },
    },
  }
})
