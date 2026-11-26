import { Briefcase, Plus, Search, SearchX } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { JobTitleListParams } from '@/api/types'
import { FilterSelect } from '@/components/FilterSelect'
import { StateBlock } from '@/components/StateBlock'
import { StatusPill } from '@/components/StatusPill'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDrawer } from '@/drawers/useDrawer'
import { useCan } from '@/features/auth/store'
import { useUrlState } from '@/hooks/useUrlState'
import { useJobTitles } from './hooks'

type StatusFilter = 'active' | 'inactive' | 'all'

const STATUS_ITEMS = [
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
  { value: 'all', label: 'Todos' },
]

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return debounced
}

export function JobTitlesView() {
  const url = useUrlState()
  const { open } = useDrawer()
  const canWrite = useCan('job-titles:write')
  const status = (url.get('status') as StatusFilter | null) ?? 'active'

  const [search, setSearch] = useState(url.get('q') ?? '')
  const q = useDebounced(search.trim(), 300)
  useEffect(() => {
    if ((url.get('q') ?? '') !== q) url.patch({ q }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const params = useMemo<JobTitleListParams>(
    () => ({ q: q || undefined, is_active: status === 'all' ? undefined : status === 'active', sort: 'name', order: 'asc' }),
    [q, status],
  )
  const { data, isPending, isError, isSuccess, refetch } = useJobTitles(params)
  const titles = data ?? []
  const filtered = q !== '' || status !== 'active'

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Puestos</h1>
          <p className="text-muted-foreground num mt-1 text-sm" aria-live="polite">
            {isPending ? 'Cargando…' : `${titles.length} ${titles.length === 1 ? 'puesto' : 'puestos'}`}
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => open('job-title-form')}>
            <Plus aria-hidden /> Nuevo puesto
          </Button>
        )}
      </header>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center" role="search">
        <div className="relative col-span-2 sm:w-auto sm:min-w-60 sm:max-w-xs sm:flex-1">
          <Search aria-hidden className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input type="search" aria-label="Buscar puestos" maxLength={100} placeholder="Buscar por nombre" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
        </div>
        <FilterSelect label="Estado" items={STATUS_ITEMS} value={status} onChange={(v) => url.patch({ status: v === 'active' ? undefined : v })} className="col-span-2 w-full sm:w-40" />
      </div>

      <div className="bg-card overflow-hidden rounded-xl border shadow-[var(--shadow-raised)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="pl-4">Puesto</TableHead>
              <TableHead className="hidden md:table-cell">Descripción</TableHead>
              <TableHead className="pr-4">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending &&
              Array.from({ length: 5 }, (_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell className="py-3 pl-4"><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-64" /></TableCell>
                  <TableCell className="pr-4"><Skeleton className="h-4 w-14" /></TableCell>
                </TableRow>
              ))}
            {isError && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3}>
                  <StateBlock icon={<SearchX aria-hidden className="size-5" />} title="No se pudo cargar el catálogo" text="Revisa tu conexión e inténtalo de nuevo." action={<Button variant="outline" onClick={() => refetch()}>Reintentar</Button>} />
                </TableCell>
              </TableRow>
            )}
            {isSuccess && titles.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3}>
                  <StateBlock
                    icon={filtered ? <SearchX aria-hidden className="size-5" /> : <Briefcase aria-hidden className="size-5" />}
                    title={filtered ? 'Ningún puesto coincide' : 'Aún no hay puestos'}
                    text={filtered ? 'Prueba con otra búsqueda o cambia el estado.' : canWrite ? 'Crea el primero para poder asignarlo a tus empleados.' : 'Cuando se creen, aparecerán aquí.'}
                    action={
                      filtered ? (
                        <Button variant="outline" onClick={() => { setSearch(''); url.patch({ q: undefined, status: undefined }) }}>Quitar filtros</Button>
                      ) : canWrite ? (
                        <Button onClick={() => open('job-title-form')}><Plus aria-hidden /> Nuevo puesto</Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            )}
            {titles.map((t) => (
              <TableRow
                key={t.id}
                tabIndex={canWrite ? 0 : undefined}
                aria-label={canWrite ? `Editar puesto ${t.name}` : undefined}
                onClick={canWrite ? () => open('job-title-form', t.id) : undefined}
                onKeyDown={
                  canWrite
                    ? (ev) => {
                        if (ev.key === 'Enter' || ev.key === ' ') {
                          ev.preventDefault()
                          open('job-title-form', t.id)
                        }
                      }
                    : undefined
                }
                className={canWrite ? 'cursor-pointer focus-visible:bg-accent/60 focus-visible:outline-none' : undefined}
              >
                <TableCell className="py-3 pl-4 font-medium">{t.name}</TableCell>
                <TableCell className="text-muted-foreground hidden max-w-md truncate md:table-cell">
                  {t.description ?? '—'}
                </TableCell>
                <TableCell className="pr-4">
                  <StatusPill tone={t.is_active ? 'ok' : 'neutral'}>{t.is_active ? 'Activo' : 'Inactivo'}</StatusPill>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
