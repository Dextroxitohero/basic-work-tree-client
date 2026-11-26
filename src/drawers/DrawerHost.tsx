import { useUrlState } from '@/hooks/useUrlState'
import { EmployeeDrawer } from '@/features/employees/EmployeeDrawer'

/** Lee `?drawer=` e `?id=` y monta el drawer correspondiente. Único punto de montaje. */
export function DrawerHost() {
  const url = useUrlState()
  const drawer = url.get('drawer')
  const id = url.get('id')
  const close = () => url.patch({ drawer: undefined, id: undefined, tab: undefined })

  if (drawer === 'employee' && id) return <EmployeeDrawer id={id} onClose={close} />
  return null
}
