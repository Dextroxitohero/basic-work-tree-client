import { Plus, Search, SearchX, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Employee, EmployeeListParams, EmployeeSort, SortOrder } from '@/api/types'
import { FilterSelect } from '@/components/FilterSelect'
import { StateBlock } from '@/components/StateBlock'
import { StatusPill } from '@/components/StatusPill'
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useDrawer } from '@/drawers/useDrawer'
import { useCan } from '@/features/auth/store'
import { useDepartmentNames, useDepartments } from '@/features/departments/hooks'
import { useUrlState } from '@/hooks/useUrlState'
import { tintFor } from '@/lib/dept-color'
import { formatDate, fullName } from '@/lib/format'
import { useEmployeeList } from './hooks'

type StatusFilter = 'active' | 'inactive' | 'all'

const STATUS_ITEMS = [
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Dados de baja' },
  { value: 'all', label: 'Todos' },
]

const SORT_ITEMS = [
  { value: 'last_name:asc', label: 'Apellido (A–Z)' },
  { value: 'last_name:desc', label: 'Apellido (Z–A)' },
  { value: 'hire_date:desc', label: 'Ingreso (reciente)' },
  { value: 'hire_date:asc', label: 'Ingreso (antiguo)' },
]

const ALL_DEPARTMENTS = 'all'

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return debounced
}

export function EmployeesView() {
  const url = useUrlState()
  const { open } = useDrawer()
  const canCreate = useCan('employees:write')
  const status = (url.get('status') as StatusFilter | null) ?? 'active'
  const department = url.get('dept') ?? ALL_DEPARTMENTS
  const sortValue = url.get('sort') ?? 'last_name:asc'

  // La URL es la fuente de verdad del texto (la búsqueda global también escribe ahí);
  // a la API llega con debounce.
  const search = url.get('q') ?? ''
  const q = useDebounced(search.trim(), 300)

  const params = useMemo<EmployeeListParams>(() => {
    const [sort, order] = sortValue.split(':') as [EmployeeSort, SortOrder]
    return {
      q: q || undefined,
      is_active: status === 'all' ? undefined : status === 'active',
      department_id: department === ALL_DEPARTMENTS ? undefined : department,
      sort,
      order,
    }
  }, [q, status, department, sortValue])

  const list = useEmployeeList(params)
  const departments = useDepartments()
  const deptName = useDepartmentNames()

  const employees = useMemo(() => list.data?.pages.flatMap((p) => p.items) ?? [], [list.data])
  const deptItems = useMemo(
    () => [
      { value: ALL_DEPARTMENTS, label: 'Todos los departamentos' },
      ...(departments.data ?? []).map((d) => ({ value: d.id, label: d.name })),
    ],
    [departments.data],
  )
  const filtered = q !== '' || status !== 'active' || department !== ALL_DEPARTMENTS

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Empleados</h1>
          <p className="text-muted-foreground num mt-1 text-sm" aria-live="polite">
            {list.isPending
              ? 'Cargando…'
              : `${employees.length}${list.hasNextPage ? '+' : ''} ${employees.length === 1 ? 'persona' : 'personas'}`}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => open('employee-form')}>
            <Plus aria-hidden /> Nuevo empleado
          </Button>
        )}
      </header>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center" role="search">
        <div className="relative col-span-2 sm:w-auto sm:min-w-60 sm:max-w-xs sm:flex-1">
          <Search aria-hidden className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            type="search"
            aria-label="Buscar empleados"
            placeholder="Buscar por nombre o email"
            value={search}
            onChange={(e) => url.patch({ q: e.target.value }, { replace: true })}
            className="pl-8"
          />
        </div>
        <FilterSelect
          label="Estado"
          items={STATUS_ITEMS}
          value={status}
          onChange={(v) => url.patch({ status: v === 'active' ? undefined : v })}
          className="w-full sm:w-40"
        />
        <FilterSelect
          label="Ordenar por"
          items={SORT_ITEMS}
          value={sortValue}
          onChange={(v) => url.patch({ sort: v === 'last_name:asc' ? undefined : v })}
          className="w-full sm:order-last sm:ml-auto sm:w-48"
        />
        <FilterSelect
          label="Departamento"
          items={deptItems}
          value={department}
          onChange={(v) => url.patch({ dept: v === ALL_DEPARTMENTS ? undefined : v })}
          className="col-span-2 w-full sm:col-span-1 sm:w-56"
        />
      </div>

      <div className="bg-card overflow-hidden rounded-xl border shadow-[var(--shadow-raised)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="pl-4">Empleado</TableHead>
              <TableHead className="hidden lg:table-cell">Departamento</TableHead>
              <TableHead className="hidden xl:table-cell">Puesto</TableHead>
              <TableHead className="hidden xl:table-cell">Ingreso</TableHead>
              <TableHead className="pr-4">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isPending && <SkeletonRows />}
            {list.isError && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5}>
                  <StateBlock
                    icon={<SearchX aria-hidden className="size-5" />}
                    title="No se pudo cargar la lista"
                    text="Revisa tu conexión e inténtalo de nuevo."
                    action={<Button variant="outline" onClick={() => list.refetch()}>Reintentar</Button>}
                  />
                </TableCell>
              </TableRow>
            )}
            {list.isSuccess && employees.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5}>
                  <StateBlock
                    icon={filtered ? <SearchX aria-hidden className="size-5" /> : <Users aria-hidden className="size-5" />}
                    title={filtered ? 'Nadie coincide con estos filtros' : 'Aún no hay empleados'}
                    text={filtered ? 'Prueba con otra búsqueda o quita algún filtro.' : canCreate ? 'Da de alta al primero para empezar.' : 'Cuando se den de alta, aparecerán aquí.'}
                    action={
                      !filtered && canCreate ? (
                        <Button onClick={() => open('employee-form')}>
                          <Plus aria-hidden /> Nuevo empleado
                        </Button>
                      ) : filtered ? (
                        <Button
                          variant="outline"
                          onClick={() => {
                            url.patch({ q: undefined, status: undefined, dept: undefined })
                          }}
                        >
                          Quitar filtros
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            )}
            {employees.map((e) => (
              <EmployeeRow
                key={e.id}
                employee={e}
                departmentName={deptName(e.department_id)}
                onOpen={() => open('employee', e.id)}
              />
            ))}
          </TableBody>
        </Table>
        {list.hasNextPage && (
          <div className="border-t p-3 text-center">
            <Button variant="ghost" onClick={() => list.fetchNextPage()} disabled={list.isFetchingNextPage}>
              {list.isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function EmployeeRow({
  employee: e,
  departmentName,
  onOpen,
}: {
  employee: Employee
  departmentName: string | null
  onOpen: () => void
}) {
  const tint = tintFor(e.department_id)
  return (
    <TableRow
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault()
          onOpen()
        }
      }}
      aria-label={`Abrir ficha de ${fullName(e)}`}
      className="cursor-pointer focus-visible:bg-accent/60 focus-visible:outline-none"
    >
      <TableCell className="py-2.5 pl-4">
        <div className="flex items-center gap-3">
          <EmployeeAvatar employee={e} />
          <div className="min-w-0">
            <div className="truncate font-medium">{fullName(e)}</div>
            <div className="text-muted-foreground truncate text-[13px]">{e.email}</div>
            {departmentName && (
              <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate text-[13px] lg:hidden">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: tint.dot }} />
                {departmentName}
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {departmentName ? (
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="size-2 rounded-full" style={{ background: tint.dot }} />
            {departmentName}
          </span>
        ) : (
          <span className="text-muted-foreground">Sin departamento</span>
        )}
      </TableCell>
      <TableCell className="hidden xl:table-cell">
        {e.current_position?.job_title.name ?? <span className="text-muted-foreground">Sin puesto</span>}
      </TableCell>
      <TableCell className="num text-muted-foreground hidden xl:table-cell">{formatDate(e.hire_date)}</TableCell>
      <TableCell className="pr-4">
        <StatusPill tone={e.is_active ? 'ok' : 'neutral'}>{e.is_active ? 'Activo' : 'Baja'}</StatusPill>
      </TableCell>
    </TableRow>
  )
}

function SkeletonRows() {
  return Array.from({ length: 8 }, (_, i) => (
    <TableRow key={i} className="hover:bg-transparent">
      <TableCell className="py-2.5 pl-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="grid gap-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell"><Skeleton className="h-3.5 w-28" /></TableCell>
      <TableCell className="hidden xl:table-cell"><Skeleton className="h-3.5 w-32" /></TableCell>
      <TableCell className="hidden xl:table-cell"><Skeleton className="h-3.5 w-20" /></TableCell>
      <TableCell className="pr-4"><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
    </TableRow>
  ))
}
