import { useQuery } from '@tanstack/react-query'
import {
  Briefcase,
  Building2,
  LayoutDashboard,
  Network,
  Search,
  ShieldAlert,
  UserCog,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { fetchMe } from '@/api/auth'
import { StateBlock } from '@/components/StateBlock'
import { DrawerHost } from '@/drawers/DrawerHost'
import { OrgMark } from '@/features/auth/OrgArt'
import { useAuthStore, useCan } from '@/features/auth/store'
import { DepartmentsView } from '@/features/departments/DepartmentsView'
import { EmployeesView } from '@/features/employees/EmployeesView'
import { JobTitlesView } from '@/features/job-titles/JobTitlesView'
import { OrgChartView } from '@/features/org-chart/OrgChartView'
import { TodayView } from '@/features/today/TodayView'
import { UsersView } from '@/features/users/UsersView'
import { useAttention } from '@/features/today/useAttention'
import { useUrlState } from '@/hooks/useUrlState'
import { cn } from '@/lib/utils'
import { HeaderActions } from './HeaderActions'
import { useGoToView } from './useGoToView'
import { VIEWS, type View } from './views'

const NAV: { view: View; label: string; icon: LucideIcon }[] = [
  { view: 'today', label: 'Hoy', icon: LayoutDashboard },
  { view: 'employees', label: 'Empleados', icon: Users },
  { view: 'org-chart', label: 'Organigrama', icon: Network },
  { view: 'departments', label: 'Departamentos', icon: Building2 },
  { view: 'job-titles', label: 'Puestos', icon: Briefcase },
  { view: 'users', label: 'Usuarios', icon: UserCog },
]

function useView(): View {
  const view = useUrlState().get('view')
  return VIEWS.find((v) => v === view) ?? 'today'
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
  const goTo = useGoToView()
  const canRead = useCan('employees:read')
  const canUsers = useCan('users:write')
  const attention = useAttention()
  useRefreshedUser()
  // «Usuarios» solo existe para quien puede administrarlos.
  const nav = NAV.filter((n) => n.view !== 'users' || canUsers)

  return (
    // Marco degradado (body) + app flotante. En móvil la app ocupa toda la pantalla.
    <div className="md:p-5 lg:p-8">
      <div className="bg-background text-foreground relative flex min-h-svh flex-col overflow-clip md:min-h-[calc(100svh-2.5rem)] md:flex-row md:rounded-[1.75rem] md:shadow-[0_30px_80px_-20px_rgb(8_4_40/0.6)] lg:min-h-[calc(100svh-4rem)]">
        <MobileHeader view={view} nav={nav} onNavigate={goTo} />

        <aside className="text-sidebar-foreground sticky top-0 hidden h-svh max-h-[calc(100svh-2.5rem)] w-60 shrink-0 flex-col self-start px-4 py-5 md:flex lg:max-h-[calc(100svh-4rem)]">
          <div className="flex items-center gap-2.5 px-2 pb-6">
            <OrgMark className="size-8" />
            <span className="text-base font-semibold tracking-tight">Work Tree</span>
          </div>
          <p className="text-muted-foreground px-3 pb-2 text-xs font-medium">Menú</p>
          <nav aria-label="Vistas" className="grid gap-1">
            {nav.map(({ view: v, label, icon: Icon }) => {
              const active = v === view
              return (
                <button
                  key={v}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => goTo(v)}
                  className={cn(
                    'flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-[var(--shadow-raised)]'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                  )}
                >
                  <Icon aria-hidden className={cn('size-[18px]', active && 'text-primary')} />
                  <span className="flex-1 text-left">{label}</span>
                  {v === 'today' && attention.items.length > 0 && (
                    <span className="bg-violet num grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] leading-5 font-semibold text-white" aria-label={`${attention.items.length} pendientes`}>
                      {attention.items.length}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="min-w-0 flex-1 px-4 pt-5 pb-8 md:px-6 md:pt-0 lg:pr-8">
            {!canRead ? (
              <StateBlock
                icon={<ShieldAlert aria-hidden className="size-5" />}
                title="Tu cuenta no tiene acceso a los datos"
                text="Pide a un administrador que te dé el permiso de lectura."
              />
            ) : view === 'today' ? (
              <TodayView />
            ) : view === 'employees' ? (
              <EmployeesView />
            ) : view === 'org-chart' ? (
              <OrgChartView />
            ) : view === 'departments' ? (
              <DepartmentsView />
            ) : view === 'users' ? (
              canUsers ? (
                <UsersView />
              ) : (
                <StateBlock
                  icon={<ShieldAlert aria-hidden className="size-5" />}
                  title="No tienes permiso para administrar usuarios"
                  text="Pide a un administrador el permiso users:write."
                />
              )
            ) : (
              <JobTitlesView />
            )}
          </main>
        </div>

        <DrawerHost />
      </div>
    </div>
  )
}

/** Búsqueda global (Ctrl/⌘ + K): lleva a Empleados con la búsqueda aplicada. */
function TopBar() {
  const goTo = useGoToView()
  const [text, setText] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function submit(e: FormEvent) {
    e.preventDefault()
    const q = text.trim()
    goTo('employees', { q: q || undefined })
    setText('')
    input.current?.blur()
  }

  return (
    <div className="hidden items-center justify-between gap-4 px-4 py-5 md:flex md:px-6 lg:pr-8">
      <form role="search" onSubmit={submit} className="relative w-full max-w-md">
        <Search aria-hidden className="text-muted-foreground pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" />
        <input
          ref={input}
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Buscar personas" maxLength={100}
          placeholder="Buscar personas"
          className="bg-card placeholder:text-muted-foreground focus-visible:ring-ring/50 h-11 w-full rounded-full border pr-16 pl-11 text-sm outline-none focus-visible:ring-3"
        />
        <kbd aria-hidden className="bg-muted text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-md px-1.5 py-0.5 text-[11px] font-medium">
          Ctrl K
        </kbd>
      </form>
      <HeaderActions />
    </div>
  )
}

function MobileHeader({ view, nav, onNavigate }: { view: View; nav: typeof NAV; onNavigate: (v: View) => void }) {
  return (
    <header className="bg-background sticky top-0 z-30 border-b md:hidden">
      <div className="flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-2.5">
          <OrgMark className="size-7" />
          <span className="text-[15px] font-semibold tracking-tight">Work Tree</span>
        </div>
        <HeaderActions />
      </div>
      <nav aria-label="Vistas" className="flex gap-1 overflow-x-auto px-3 py-2 [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]">
        {nav.map(({ view: v, label, icon: Icon }) => (
          <button
            key={v}
            type="button"
            aria-current={v === view ? 'page' : undefined}
            onClick={() => onNavigate(v)}
            className={cn(
              'flex h-9 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-medium',
              v === view ? 'bg-card text-primary shadow-[var(--shadow-raised)]' : 'text-foreground/70',
            )}
          >
            <Icon aria-hidden className="size-4" />
            {label}
          </button>
        ))}
      </nav>
    </header>
  )
}
