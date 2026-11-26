import { Eye, EyeOff, Pencil, UserMinus, UserPlus } from 'lucide-react'
import { useState } from 'react'
import type { EmployeeDetail, PositionHistory } from '@/api/types'
import { EmployeeLink } from '@/components/EmployeeLink'
import { StatusPill } from '@/components/StatusPill'
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrawer } from '@/drawers/useDrawer'
import { useCan } from '@/features/auth/store'
import { useDepartmentNames } from '@/features/departments/hooks'
import { useUrlState } from '@/hooks/useUrlState'
import { formatDate, formatSalary, fullName } from '@/lib/format'
import { useUiStore } from '@/stores/ui'
import { useEmployee } from './hooks'
import { useDeactivateEmployee, useReactivateEmployee } from './mutations'

type Tab = 'data' | 'positions' | 'reports'

export function EmployeeDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isPending, isError, refetch } = useEmployee(id)
  const url = useUrlState()
  const tab = (url.get('tab') as Tab | null) ?? 'data'

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="gap-0 p-0 data-[side=right]:sm:max-w-lg">
        {isPending && <DrawerSkeleton />}
        {isError && (
          <div className="grid gap-3 p-6">
            <SheetTitle>No se pudo cargar la ficha</SheetTitle>
            <SheetDescription>Puede que el empleado ya no exista o que falle la conexión.</SheetDescription>
            <div>
              <Button variant="outline" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          </div>
        )}
        {data && (
          <>
            <Header employee={data} />
            <Tabs
              value={tab}
              onValueChange={(v) => url.patch({ tab: v === 'data' ? undefined : String(v) }, { replace: true })}
              className="min-h-0 flex-1 gap-0"
            >
              <TabsList variant="line" className="w-full justify-start gap-4 border-b px-6">
                <TabsTrigger value="data">Datos</TabsTrigger>
                <TabsTrigger value="positions">Puestos</TabsTrigger>
                <TabsTrigger value="reports">
                  Reportes <span className="num text-muted-foreground">{data.direct_reports.length}</span>
                </TabsTrigger>
              </TabsList>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <TabsContent value="data">
                  <DataTab employee={data} />
                </TabsContent>
                <TabsContent value="positions">
                  <PositionsTab history={data.position_history} />
                </TabsContent>
                <TabsContent value="reports">
                  <ReportsTab employee={data} />
                </TabsContent>
              </div>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Header({ employee: e }: { employee: EmployeeDetail }) {
  const { open } = useDrawer()
  const canWrite = useCan('employees:write')
  const canAssign = useCan('positions:write')
  const [confirmingBaja, setConfirmingBaja] = useState(false)
  const deactivate = useDeactivateEmployee()
  const reactivate = useReactivateEmployee()

  return (
    <SheetHeader className="gap-4 border-b p-6 pr-14">
      <div className="flex items-center gap-4">
        <EmployeeAvatar employee={e} className="size-14 text-lg" />
        <div className="min-w-0">
          <SheetTitle className="truncate text-xl font-semibold tracking-tight">{fullName(e)}</SheetTitle>
          <SheetDescription className="truncate">
            {e.current_position?.job_title.name ?? 'Sin puesto asignado'}
          </SheetDescription>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone={e.is_active ? 'ok' : 'neutral'} className="mr-1">
          {e.is_active ? 'Activo' : 'Dado de baja'}
        </StatusPill>
        {canWrite && (
          <Button variant="outline" size="sm" onClick={() => open('employee-form', e.id)}>
            <Pencil aria-hidden /> Editar
          </Button>
        )}
        {canAssign && e.is_active && (
          <Button variant="outline" size="sm" onClick={() => open('position-form', e.id)}>
            <UserPlus aria-hidden /> Asignar puesto
          </Button>
        )}
        {canWrite &&
          (e.is_active ? (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setConfirmingBaja(true)}>
              <UserMinus aria-hidden /> Dar de baja
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled={reactivate.isPending} onClick={() => reactivate.mutate(e.id)}>
              {reactivate.isPending ? 'Reactivando…' : 'Reactivar'}
            </Button>
          ))}
      </div>

      <AlertDialog open={confirmingBaja} onOpenChange={setConfirmingBaja}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Dar de baja a {fullName(e)}?</AlertDialogTitle>
            <AlertDialogDescription>
              Se cerrará su puesto actual con la fecha de hoy. Sus subordinados quedarán sin jefe y los departamentos que
              encargaba quedarán sin encargado. Se conserva el historial, pero al reactivarlo no se recupera nada de eso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deactivate.isPending}
              onClick={() => deactivate.mutate(e.id)}
            >
              Dar de baja
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SheetHeader>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-2.5 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </div>
  )
}

function DataTab({ employee: e }: { employee: EmployeeDetail }) {
  const deptName = useDepartmentNames()
  const hide = useUiStore((s) => s.hideSalaries)
  const toggle = useUiStore((s) => s.toggleHideSalaries)
  const pos = e.current_position

  return (
    <dl className="divide-y">
      <Row label="Email">{e.email}</Row>
      <Row label="Teléfono">{e.phone ?? <span className="text-muted-foreground">—</span>}</Row>
      <Row label="Departamento">
        {deptName(e.department_id) ?? <span className="text-muted-foreground">Sin departamento</span>}
      </Row>
      <Row label="Ingreso">
        <span className="num">{formatDate(e.hire_date)}</span>
      </Row>
      <Row label="Salario actual">
        {pos ? (
          <span className="inline-flex items-center gap-2">
            <span className="num font-medium">{hide ? '••••••' : formatSalary(pos.salary)}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggle}
              aria-label={hide ? 'Mostrar salarios' : 'Ocultar salarios'}
              aria-pressed={hide}
            >
              {hide ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
            </Button>
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </Row>
    </dl>
  )
}

function PositionsTab({ history }: { history: PositionHistory[] }) {
  const hide = useUiStore((s) => s.hideSalaries)
  if (history.length === 0)
    return <p className="text-muted-foreground py-6 text-center text-sm">Sin historial de puestos.</p>

  const ordered = [...history].sort((a, b) => b.start_date.localeCompare(a.start_date))
  return (
    <ol className="grid gap-3">
      {ordered.map((p) => (
        <li key={p.id} className="rounded-lg border p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="font-medium">{p.job_title.name}</p>
            {p.end_date === null && (
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                Actual
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground num mt-1 text-[13px]">
            {formatDate(p.start_date)} – {p.end_date ? formatDate(p.end_date) : 'hoy'}
          </p>
          <p className="num mt-2 text-sm">{hide ? '••••••' : formatSalary(p.salary)}</p>
          {p.notes && <p className="text-muted-foreground mt-2 text-sm">{p.notes}</p>}
        </li>
      ))}
    </ol>
  )
}

function ReportsTab({ employee }: { employee: EmployeeDetail }) {
  const { open } = useDrawer()
  if (employee.direct_reports.length === 0)
    return <p className="text-muted-foreground py-6 text-center text-sm">No tiene reportes directos.</p>
  return (
    <ul className="-mx-2 grid">
      {employee.direct_reports.map((r) => (
        <li key={r.id}>
          <EmployeeLink employee={r} onOpen={() => open('employee', r.id)} />
        </li>
      ))}
    </ul>
  )
}

function DrawerSkeleton() {
  return (
    <div className="grid gap-6 p-6" aria-busy>
      <SheetTitle className="sr-only">Cargando ficha</SheetTitle>
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="grid gap-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  )
}
