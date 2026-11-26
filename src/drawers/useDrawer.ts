import { useCallback } from 'react'
import { useUrlState } from '@/hooks/useUrlState'

export type DrawerName =
  | 'employee'
  | 'employee-form'
  | 'position-form'
  | 'department'
  | 'department-form'
  | 'job-title-form'

/** Abrir y cerrar drawers cambiando la URL. `id` ausente en un formulario = alta. */
export function useDrawer() {
  const { get, patch } = useUrlState()

  const open = useCallback(
    (drawer: DrawerName, id?: string) => patch({ drawer, id, tab: undefined }),
    [patch],
  )
  const close = useCallback(() => patch({ drawer: undefined, id: undefined, tab: undefined }), [patch])

  return { drawer: get('drawer') as DrawerName | null, id: get('id'), open, close }
}
