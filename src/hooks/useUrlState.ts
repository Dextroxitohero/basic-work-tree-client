import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

/**
 * Estado en la URL: filtros, búsqueda y drawer viven en search params para que
 * se puedan compartir y sobrevivan a recargas.
 */
export function useUrlState() {
  const [params, setParams] = useSearchParams()

  const get = useCallback((key: string) => params.get(key), [params])

  /** `undefined`/'' borra la clave. `replace` evita llenar el historial al teclear. */
  const patch = useCallback(
    (changes: Record<string, string | undefined>, options?: { replace?: boolean }) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(changes)) {
            if (value === undefined || value === '') next.delete(key)
            else next.set(key, value)
          }
          return next
        },
        { replace: options?.replace ?? false },
      )
    },
    [setParams],
  )

  return { get, patch }
}
