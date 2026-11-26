import type { UUID } from '@/api/types'

/** Tono estable por departamento: el mismo id da siempre el mismo color. */
export function hueFor(id: UUID | null | undefined): number {
  if (!id) return 250
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return hash % 360
}

/** Fondo y texto de avatar/punto con contraste suficiente (texto oscuro sobre tinte claro). */
export function tintFor(id: UUID | null | undefined) {
  const hue = hueFor(id)
  return {
    background: `oklch(0.92 0.05 ${hue})`,
    color: `oklch(0.34 0.09 ${hue})`,
    dot: `oklch(0.62 0.13 ${hue})`,
  }
}
