import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowRight, CheckCircle2, UserPlus, Users } from 'lucide-react'
import { useMemo } from 'react'
import type { Department } from '@/api/types'
import { useGoToView } from '@/components/layout/useGoToView'
import { StatusPill } from '@/components/StatusPill'
import { EmployeeLink } from '@/components/EmployeeLink'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDrawer } from '@/drawers/useDrawer'
import { useDepartments, useDepartmentNames } from '@/features/departments/hooks'
import { useEmployeeList } from '@/features/employees/hooks'
import { tintFor } from '@/lib/dept-color'
import { formatDate } from '@/lib/format'
import { useAttention } from './useAttention'

const card = 'bg-card min-w-0 rounded-2xl border p-5 shadow-[var(--shadow-raised)]'

export function TodayView() {
  const today = format(new Date(), "EEEE d 'de' MMMM", { locale: es })
  const departments = useDepartments()
  const attention = useAttention()
  const goTo = useGoToView()

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Hoy</h1>
        <p className="text-muted-foreground mt-1 text-sm first-letter:uppercase">{today}</p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PeopleCard departments={departments.data} pending={departments.isPending} className="lg:col-span-2" />
        <AttentionSummary count={attention.items.length} first={attention.items[0]?.title} pending={attention.isPending} />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <section className={`${card} lg:col-span-2`} aria-labelledby="dept-pulse">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="dept-pulse" className="font-semibold">Pulso de departamentos</h2>
              <p className="text-muted-foreground mt-0.5 text-[13px]">Personas activas y si tienen encargado.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => goTo('departments')}>
              Ver todos <ArrowRight aria-hidden />
            </Button>
          </div>
          <DepartmentPulse departments={departments.data} pending={departments.isPending} error={departments.isError} onRetry={departments.refetch} />
        </section>

        <div className="grid min-w-0 gap-4">
          <AttentionList items={attention.items} pending={attention.isPending} />
          <RecentHires />
        </div>
      </div>
    </div>
  )
}

function PeopleCard({ departments, pending, className }: { departments?: Department[]; pending: boolean; className?: string }) {
  const total = (departments ?? []).reduce((n, d) => n + d.employee_count, 0)
  const sorted = useMemo(() => [...(departments ?? [])].sort((a, b) => b.employee_count - a.employee_count), [departments])

  return (
    <section className={`${card} ${className ?? ''}`} aria-labelledby="people-title">
      <h2 id="people-title" className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
        <Users aria-hidden className="size-4" /> Personas activas en departamentos
      </h2>
      {pending ? (
        <Skeleton className="mt-4 h-24 w-full" />
      ) : total === 0 ? (
        <p className="text-muted-foreground mt-4 text-sm">Todavía no hay personas asignadas a departamentos.</p>
      ) : (
        <>
          <p className="num mt-3 text-5xl font-semibold tracking-tight">{total}</p>
          <p className="text-muted-foreground mt-1 text-sm">
            en {sorted.length} {sorted.length === 1 ? 'departamento' : 'departamentos'}
          </p>
          <div
            role="img"
            aria-label={sorted.map((d) => `${d.name}: ${d.employee_count}`).join(', ')}
            className="bg-muted mt-5 flex h-3 gap-0.5 overflow-hidden rounded-full"
          >
            {sorted
              .filter((d) => d.employee_count > 0)
              .map((d) => (
                <span key={d.id} style={{ width: `${(d.employee_count / total) * 100}%`, background: tintFor(d.id).dot }} className="min-w-1 first:rounded-l-full last:rounded-r-full" />
              ))}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
            {sorted.slice(0, 4).map((d) => (
              <li key={d.id} className="flex items-center gap-2">
                <span aria-hidden className="size-2 rounded-full" style={{ background: tintFor(d.id).dot }} />
                {d.name} <span className="num text-muted-foreground">{d.employee_count}</span>
              </li>
            ))}
            {sorted.length > 4 && <li className="text-muted-foreground">+{sorted.length - 4} más</li>}
          </ul>
        </>
      )}
    </section>
  )
}

function AttentionSummary({ count, first, pending }: { count: number; first?: string; pending: boolean }) {
  return (
    <section className="bg-primary text-primary-foreground flex min-w-0 flex-col justify-between gap-5 rounded-2xl p-5 shadow-[var(--shadow-raised)]" aria-labelledby="attention-summary">
      <div>
        <h2 id="attention-summary" className="text-primary-foreground/75 text-sm font-medium">Requiere atención</h2>
        {pending ? (
          <Skeleton className="mt-3 h-10 w-24 bg-white/20" />
        ) : count === 0 ? (
          <p className="mt-2 flex items-center gap-2 text-xl font-semibold tracking-tight">
            <CheckCircle2 aria-hidden className="size-5" /> Todo en orden
          </p>
        ) : (
          <>
            <p className="num mt-2 text-5xl font-semibold tracking-tight">{count}</p>
            <p className="text-primary-foreground/85 mt-2 text-sm">{first}</p>
          </>
        )}
      </div>
      {!pending && count > 0 && (
        <a href="#atencion" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 inline-flex h-9 w-fit items-center gap-2 rounded-lg px-3.5 text-sm font-medium">
          Ver pendientes <ArrowRight aria-hidden className="size-4" />
        </a>
      )}
    </section>
  )
}

function DepartmentPulse({
  departments,
  pending,
  error,
  onRetry,
}: {
  departments?: Department[]
  pending: boolean
  error: boolean
  onRetry: () => void
}) {
  const { open } = useDrawer()
  const rows = (departments ?? []).slice(0, 8)
  const max = Math.max(1, ...rows.map((d) => d.employee_count))

  if (error)
    return (
      <div className="mt-4 flex items-center gap-3 text-sm">
        <span className="text-muted-foreground">No se pudieron cargar los departamentos.</span>
        <Button variant="outline" size="sm" onClick={onRetry}>Reintentar</Button>
      </div>
    )

  return (
    <Table className="mt-3">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Departamento</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Personas</TableHead>
          <TableHead className="hidden xl:table-cell">Distribución</TableHead>
          <TableHead>Encargado</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pending &&
          Array.from({ length: 4 }, (_, i) => (
            <TableRow key={i} className="hover:bg-transparent">
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="ml-auto h-4 w-8" /></TableCell>
              <TableCell className="hidden xl:table-cell"><Skeleton className="h-2 w-24" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
            </TableRow>
          ))}
        {!pending && rows.length === 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={4} className="text-muted-foreground py-8 text-center">Aún no hay departamentos.</TableCell>
          </TableRow>
        )}
        {rows.map((d) => (
          <TableRow
            key={d.id}
            tabIndex={0}
            aria-label={`Abrir departamento ${d.name}`}
            onClick={() => open('department', d.id)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter' || ev.key === ' ') {
                ev.preventDefault()
                open('department', d.id)
              }
            }}
            className="focus-visible:bg-accent/60 cursor-pointer focus-visible:outline-none"
          >
            <TableCell className="py-3 font-medium">
              <span className="inline-flex items-center gap-2.5">
                <span aria-hidden className="size-2.5 rounded-full" style={{ background: tintFor(d.id).dot }} />
                {d.name}
                <span className="num text-muted-foreground sm:hidden">{d.employee_count}</span>
              </span>
            </TableCell>
            <TableCell className="num hidden text-right sm:table-cell">{d.employee_count}</TableCell>
            <TableCell className="hidden xl:table-cell">
              <span aria-hidden className="bg-muted block h-1.5 w-28 overflow-hidden rounded-full">
                <span className="block h-full rounded-full" style={{ width: `${(d.employee_count / max) * 100}%`, background: tintFor(d.id).dot }} />
              </span>
            </TableCell>
            <TableCell>{d.manager_id ? <StatusPill tone="ok">Con encargado</StatusPill> : <StatusPill tone="warn">Sin encargado</StatusPill>}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function AttentionList({ items, pending }: { items: ReturnType<typeof useAttention>['items']; pending: boolean }) {
  return (
    <section id="atencion" className={card} aria-labelledby="attention-title">
      <h2 id="attention-title" className="font-semibold">Requiere acción</h2>
      {pending ? (
        <Skeleton className="mt-4 h-20 w-full" />
      ) : items.length === 0 ? (
        <p className="text-muted-foreground mt-3 flex items-center gap-2 text-sm">
          <CheckCircle2 aria-hidden className="text-ok size-4" /> No hay nada pendiente.
        </p>
      ) : (
        <ul className="mt-3 divide-y">
          {items.slice(0, 5).map((item) => (
            <li key={item.id} className="py-3 first:pt-0 last:pb-0">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-muted-foreground mt-0.5 text-[13px]">{item.detail}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={item.action.run}>{item.action.label}</Button>
            </li>
          ))}
          {items.length > 5 && <li className="text-muted-foreground pt-3 text-[13px]">y {items.length - 5} más</li>}
        </ul>
      )}
    </section>
  )
}

function RecentHires() {
  const { open } = useDrawer()
  const deptName = useDepartmentNames()
  const list = useEmployeeList({ is_active: true, sort: 'hire_date', order: 'desc' })
  const people = (list.data?.pages[0]?.items ?? []).slice(0, 5)

  return (
    <section className={card} aria-labelledby="hires-title">
      <h2 id="hires-title" className="flex items-center gap-2 font-semibold">
        <UserPlus aria-hidden className="text-muted-foreground size-4" /> Ingresos recientes
      </h2>
      {list.isPending ? (
        <Skeleton className="mt-4 h-24 w-full" />
      ) : people.length === 0 ? (
        <p className="text-muted-foreground mt-3 text-sm">Aún no hay empleados.</p>
      ) : (
        <ul className="-mx-2 mt-2 grid">
          {people.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <EmployeeLink employee={p} onOpen={() => open('employee', p.id)} />
              </div>
              <span className="text-muted-foreground num shrink-0 pr-2 text-right text-xs">
                {formatDate(p.hire_date)}
                {deptName(p.department_id) && <span className="block">{deptName(p.department_id)}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
