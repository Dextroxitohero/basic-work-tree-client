import { useQuery } from '@tanstack/react-query'
import { Briefcase, Building2, LogOut, Network, ShieldAlert, Users, type LucideIcon } from 'lucide-react'
import { useEffect } from 'react'
import { fetchMe } from '@/api/auth'
import { Button } from '@/components/ui/button'
import { DrawerHost } from '@/drawers/DrawerHost'
import { OrgMark } from '@/features/auth/OrgArt'
import { useAuthStore, useCan } from '@/features/auth/store'
import { EmployeesView, StateBlock } from '@/features/employees/EmployeesView'
import { useUrlState } from '@/hooks/useUrlState'
import { cn } from '@/lib/utils'
import { VIEWS, type View } from './views'

const NAV: { view: View; label: string; icon: LucideIcon }[] = [
  { view: 'employees', label: 'Empleados', icon: Users },
  { view: 'org-chart', label: 'Organigrama', icon: Network },
  { view: 'departments', label: 'Departamentos', icon: Building2 },
  { view: 'job-titles', label: 'Puestos', icon: Briefcase },
]

function useView(): View {
  const view = useUrlState().get('view')
  return VIEWS.find((v) => v === view) ?? 'employees'
}

/** Mantiene los permisos al día: pueden haber cambiado desde que se emitió el token. */
function useRefreshedUser() {
  const setUser = useAuthStore((s) => s.setUser)
  const { data } = useQuery({ queryKey: ['auth', 'me'], queryFn: fetchMe, staleTime: 60_000 })
  useEffect(() => {
    if (data) setUser(data)
  }, [data, setUser])
}

export function Workspace() {
  const view = useView()
  const url = useUrlState()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const canRead = useCan('employees:read')
  useRefreshedUser()

  // Cambiar de vista descarta filtros y drawer de la anterior.
  const goTo = (v: View) =>
    url.patch({ view: v === 'employees' ? undefined : v, q: undefined, status: undefined, dept: undefined, sort: undefined, drawer: undefined, id: undefined, tab: undefined })

  const name = user?.full_name || user?.email || 'Sesión activa'

  return (
    <div className="flex min-h-svh flex-col md:flex-row">

      <header className="bg-sidebar sticky top-0 z-30 border-b md:hidden">
        <div className="flex items-center justify-between px-4 pt-3">
          <div className="flex items-center gap-2.5">
            <OrgMark className="size-7" />
            <span className="text-[15px] font-semibold tracking-tight">Work Tree</span>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} aria-label="Cerrar sesión">
            <LogOut aria-hidden />
          </Button>
        </div>
        <nav aria-label="Vistas" className="flex gap-1 overflow-x-auto px-3 py-2 [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]">
          {NAV.map(({ view: v, label, icon: Icon }) => (
            <button
              key={v}
              type="button"
              aria-current={v === view ? 'page' : undefined}
              onClick={() => goTo(v)}
              className={cn(
                'flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium',
                v === view ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/70',
              )}
            >
              <Icon aria-hidden className={cn('size-4', v === view && 'text-primary')} />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-svh w-60 shrink-0 flex-col border-r px-3 py-4 md:flex">
        <div className="flex items-center gap-2.5 px-2 pb-5">
          <OrgMark className="size-7" />
          <span className="text-[15px] font-semibold tracking-tight">Work Tree</span>
        </div>
        <nav aria-label="Vistas" className="grid gap-0.5">
          {NAV.map(({ view: v, label, icon: Icon }) => {
            const active = v === view
            return (
              <button
                key={v}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => goTo(v)}
                className={cn(
                  'flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                )}
              >
                <Icon aria-hidden className={cn('size-4', active && 'text-primary')} />
                {label}
              </button>
            )
          })}
        </nav>

        <div className="mt-auto border-t pt-3">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <span aria-hidden className="bg-primary/12 text-primary grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold">
              {name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{name}</p>
              {user?.full_name && <p className="text-muted-foreground truncate text-xs">{user.email}</p>}
            </div>
          </div>
          <Button variant="ghost" size="sm" className="mt-1 w-full justify-start px-2.5" onClick={logout}>
            <LogOut aria-hidden /> Cerrar sesión
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        {!canRead ? (
          <StateBlock
            icon={<ShieldAlert aria-hidden className="size-5" />}
            title="Tu cuenta no tiene acceso a los datos"
            text="Pide a un administrador que te dé el permiso de lectura."
          />
        ) : view === 'employees' ? (
          <EmployeesView />
        ) : (
          <StateBlock
            icon={<Network aria-hidden className="size-5" />}
            title="Esta vista está en construcción"
            text="Mientras tanto puedes trabajar desde Empleados."
          />
        )}
      </main>

      <DrawerHost />
    </div>
  )
}
