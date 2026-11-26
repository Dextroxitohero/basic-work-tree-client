import { useDrawer } from '@/drawers/useDrawer'
import { useGoToView } from '@/components/layout/useGoToView'
import { useCan } from '@/features/auth/store'
import { useDepartments } from '@/features/departments/hooks'
import { useEmployeeList } from '@/features/employees/hooks'

export interface AttentionItem {
  id: string
  tone: 'warn' | 'risk'
  title: string
  detail: string
  action: { label: string; run: () => void }
}

/**
 * Pendientes derivados de datos reales de la API: no hay endpoint de alertas.
 * - Departamentos sin encargado (de la lista completa de departamentos).
 * - Más de una persona en la cima del organigrama (empleados activos sin jefe).
 */
export function useAttention() {
  const departments = useDepartments()
  const roots = useEmployeeList({ has_manager: false, is_active: true, sort: 'last_name', order: 'asc' })
  const { open } = useDrawer()
  const goTo = useGoToView()
  const canEditDepartments = useCan('departments:write')

  const items: AttentionItem[] = []

  for (const d of departments.data ?? []) {
    if (d.manager_id) continue
    items.push({
      id: `dept-${d.id}`,
      tone: 'warn',
      title: `${d.name} no tiene encargado`,
      detail: `${d.employee_count} ${d.employee_count === 1 ? 'persona' : 'personas'} activas`,
      action: canEditDepartments
        ? { label: 'Asignar encargado', run: () => open('department-form', d.id) }
        : { label: 'Ver departamento', run: () => open('department', d.id) },
    })
  }

  const rootCount = roots.data?.pages.flatMap((p) => p.items).length ?? 0
  if (rootCount > 1) {
    items.push({
      id: 'roots',
      tone: 'warn',
      title: `${rootCount}${roots.hasNextPage ? '+' : ''} personas están en la cima sin jefe`,
      detail: 'Suele indicar jefes sin asignar tras una baja.',
      action: { label: 'Ver organigrama', run: () => goTo('org-chart') },
    })
  }

  return { items, isPending: departments.isPending || roots.isPending }
}
