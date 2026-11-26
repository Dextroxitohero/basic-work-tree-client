import { Search, SearchX, UserCog } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { UserListParams } from '@/api/users'
import { FilterSelect } from '@/components/FilterSelect'
import { StateBlock } from '@/components/StateBlock'
import { StatusPill } from '@/components/StatusPill'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useDrawer } from '@/drawers/useDrawer'
import { useAuthStore } from '@/features/auth/store'
import { useUrlState } from '@/hooks/useUrlState'
import { useUserList } from './hooks'

type StatusFilter = 'all' | 'active' | 'inactive'

const STATUS_ITEMS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Desactivados' },
]

const SORT_ITEMS = [
  { value: 'email:asc', label: 'Email (A–Z)' },
  { value: 'email:desc', label: 'Email (Z–A)' },
  { value: 'created_at:desc', label: 'Registro (reciente)' },
  { value: 'created_at:asc', label: 'Registro (antiguo)' },
]

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return debounced
}

export function UsersView() {
  const url = useUrlState()
  const { open } = useDrawer()
  const me = useAuthStore((s) => s.user)
  const status = (url.get('status') as StatusFilter | null) ?? 'all'
  const sortValue = url.get('sort') ?? 'email:asc'

  const search = url.get('q') ?? ''
  const q = useDebounced(search.trim(), 300)

  const params = useMemo<UserListParams>(() => {
    const [sort, order] = sortValue.split(':') as [NonNullable<UserListParams['sort']>, 'asc' | 'desc']
    return { q: q || undefined, is_active: status === 'all' ? undefined : status === 'active', sort, order }
  }, [q, status, sortValue])

  const list = useUserList(params)
  const users = useMemo(() => list.data?.pages.flatMap((p) => p.items) ?? [], [list.data])
  const filtered = q !== '' || status !== 'all'

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground num mt-1 text-sm" aria-live="polite">
          {list.isPending ? 'Cargando…' : `${users.length}${list.hasNextPage ? '+' : ''} ${users.length === 1 ? 'usuario' : 'usuarios'}`}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center" role="search">
        <div className="relative col-span-2 sm:w-auto sm:min-w-60 sm:max-w-xs sm:flex-1">
          <Search aria-hidden className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            type="search"
            aria-label="Buscar usuarios"
            maxLength={100}
            placeholder="Buscar por email o nombre"
            value={search}
            onChange={(e) => url.patch({ q: e.target.value }, { replace: true })}
            className="pl-8"
          />
        </div>
        <FilterSelect label="Estado" items={STATUS_ITEMS} value={status} onChange={(v) => url.patch({ status: v === 'all' ? undefined : v })} className="w-full sm:w-44" />
        <FilterSelect label="Ordenar por" items={SORT_ITEMS} value={sortValue} onChange={(v) => url.patch({ sort: v === 'email:asc' ? undefined : v })} className="w-full sm:ml-auto sm:w-48" />
      </div>

      <div className="bg-card overflow-hidden rounded-xl border shadow-[var(--shadow-raised)]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="pl-4">Usuario</TableHead>
              <TableHead className="hidden md:table-cell">Permisos</TableHead>
              <TableHead className="pr-4">Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.isPending &&
              Array.from({ length: 6 }, (_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  <TableCell className="py-3 pl-4"><Skeleton className="h-9 w-56" /></TableCell>
                  <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell className="pr-4"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                </TableRow>
              ))}
            {list.isError && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3}>
                  <StateBlock icon={<SearchX aria-hidden className="size-5" />} title="No se pudo cargar la lista" text="Revisa tu conexión e inténtalo de nuevo." action={<Button variant="outline" onClick={() => list.refetch()}>Reintentar</Button>} />
                </TableCell>
              </TableRow>
            )}
            {list.isSuccess && users.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3}>
                  <StateBlock
                    icon={filtered ? <SearchX aria-hidden className="size-5" /> : <UserCog aria-hidden className="size-5" />}
                    title={filtered ? 'Nadie coincide con estos filtros' : 'Aún no hay usuarios'}
                    text={filtered ? 'Prueba con otra búsqueda o cambia el estado.' : 'Cuando alguien se registre, aparecerá aquí.'}
                    action={filtered ? <Button variant="outline" onClick={() => url.patch({ q: undefined, status: undefined })}>Quitar filtros</Button> : undefined}
                  />
                </TableCell>
              </TableRow>
            )}
            {users.map((u) => {
              const name = u.full_name || u.email
              return (
                <TableRow
                  key={u.id}
                  tabIndex={0}
                  aria-label={`Editar usuario ${name}`}
                  onClick={() => open('user', u.id)}
                  onKeyDown={(ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault()
                      open('user', u.id)
                    }
                  }}
                  className="focus-visible:bg-accent/60 cursor-pointer focus-visible:outline-none"
                >
                  <TableCell className="py-2.5 pl-4">
                    <div className="flex items-center gap-3">
                      <span aria-hidden className="bg-primary/10 text-primary grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold">
                        {name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {name}
                          {u.id === me?.id && <span className="text-muted-foreground font-normal"> (tú)</span>}
                        </div>
                        {u.full_name && <div className="text-muted-foreground truncate text-[13px]">{u.email}</div>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="num text-muted-foreground hidden md:table-cell">
                    {u.permissions.length} {u.permissions.length === 1 ? 'permiso' : 'permisos'}
                  </TableCell>
                  <TableCell className="pr-4">
                    <StatusPill tone={u.is_active ? 'ok' : 'neutral'}>{u.is_active ? 'Activo' : 'Desactivado'}</StatusPill>
                  </TableCell>
                </TableRow>
              )
            })}
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
