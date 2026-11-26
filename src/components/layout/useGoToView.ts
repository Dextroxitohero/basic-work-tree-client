import { useCallback } from 'react'
import { useUrlState } from '@/hooks/useUrlState'
import type { View } from './views'

/** Cambiar de vista descarta filtros y drawer de la anterior. `today` es la vista por defecto. */
export function useGoToView() {
  const { patch } = useUrlState()
  return useCallback(
    (view: View, extra: Record<string, string | undefined> = {}) =>
      patch({
        view: view === 'today' ? undefined : view,
        q: undefined,
        status: undefined,
        dept: undefined,
        sort: undefined,
        root: undefined,
        drawer: undefined,
        id: undefined,
        tab: undefined,
        ...extra,
      }),
    [patch],
  )
}
