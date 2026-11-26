import { Pencil } from 'lucide-react'
import { EmployeeLink } from '@/components/EmployeeLink'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useDrawer } from '@/drawers/useDrawer'
import { useCan } from '@/features/auth/store'
import { useEmployee, useEmployeeList } from '@/features/employees/hooks'
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar'
import { fullName } from '@/lib/format'
import { tintFor } from '@/lib/dept-color'
import { useDepartment } from './hooks'

export function DepartmentDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const { data, isPending, isError, refetch } = useDepartment(id)
  const { open } = useDrawer()
  const canWrite = useCan('departments:write')
  const manager = useEmployee(data?.manager_id ?? null)
  const members = useEmployeeList({ department_id: id, is_active: true, sort: 'last_name', order: 'asc' })
  const people = members.data?.pages.flatMap((p) => p.items) ?? []

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="gap-0 p-0 data-[side=right]:sm:max-w-lg">
        {isPending && (
          <div className="grid gap-4 p-6" aria-busy>
            <SheetTitle className="sr-only">Cargando departamento</SheetTitle>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}
        {isError && (
          <div className="grid gap-3 p-6">
            <SheetTitle>No se pudo cargar el departamento</SheetTitle>
            <SheetDescription>Puede que ya no exista o que falle la conexión.</SheetDescription>
            <div>
              <Button variant="outline" onClick={() => refetch()}>
                Reintentar
              </Button>
            </div>
          </div>
        )}
        {data && (
          <>
            <SheetHeader className="gap-3 border-b p-6 pr-14">
              <div className="flex items-center gap-3">
                <span aria-hidden className="size-3 shrink-0 rounded-full" style={{ background: tintFor(data.id).dot }} />
                <SheetTitle className="truncate text-xl font-semibold tracking-tight">{data.name}</SheetTitle>
              </div>
              <SheetDescription className="num">
                {data.employee_count} {data.employee_count === 1 ? 'empleado activo' : 'empleados activos'}
              </SheetDescription>
              {canWrite && (
                <div>
                  <Button variant="outline" size="sm" onClick={() => open('department-form', data.id)}>
                    <Pencil aria-hidden /> Editar
                  </Button>
                </div>
              )}
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <section aria-labelledby="dept-manager">
                <h3 id="dept-manager" className="text-muted-foreground mb-2 text-sm font-medium">
                  Encargado
                </h3>
                {!data.manager_id ? (
                  <p className="text-muted-foreground text-sm">Sin encargado.</p>
                ) : manager.data ? (
                  <button
                    type="button"
                    onClick={() => open('employee', manager.data.id)}
                    className="hover:bg-muted -mx-2 flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left"
                  >
                    <EmployeeAvatar employee={manager.data} className="size-8 text-xs" />
                    <span className="text-sm font-medium">{fullName(manager.data)}</span>
                  </button>
                ) : (
                  <Skeleton className="h-8 w-40" />
                )}
              </section>

              <section aria-labelledby="dept-people" className="mt-6">
                <h3 id="dept-people" className="text-muted-foreground mb-2 text-sm font-medium">
                  Empleados
                </h3>
                {members.isPending ? (
                  <Skeleton className="h-24 w-full" />
                ) : people.length === 0 ? (
                  <p className="text-muted-foreground py-4 text-sm">Nadie en este departamento todavía.</p>
                ) : (
                  <ul className="-mx-2 grid">
                    {people.map((p) => (
                      <li key={p.id}>
                        <EmployeeLink employee={p} onOpen={() => open('employee', p.id)} />
                      </li>
                    ))}
                  </ul>
                )}
                {members.hasNextPage && (
                  <Button variant="ghost" size="sm" className="mt-2" onClick={() => members.fetchNextPage()} disabled={members.isFetchingNextPage}>
                    {members.isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
                  </Button>
                )}
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
