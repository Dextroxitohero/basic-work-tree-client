import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Network, SearchX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { getEmployeeTree } from '@/api/employees'
import { keys } from '@/api/keys'
import type { EmployeeTreeNode } from '@/api/types'
import { FilterSelect } from '@/components/FilterSelect'
import { StateBlock } from '@/components/StateBlock'
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDrawer } from '@/drawers/useDrawer'
import { useEmployeeList } from '@/features/employees/hooks'
import { useUrlState } from '@/hooks/useUrlState'
import { fullName } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Raíces = empleados activos sin jefe. */
export function OrgChartView() {
  const url = useUrlState()
  const roots = useEmployeeList({ has_manager: false, is_active: true, sort: 'last_name', order: 'asc' })
  const candidates = useMemo(() => roots.data?.pages.flatMap((p) => p.items) ?? [], [roots.data])

  const requested = url.get('root')
  const rootId = candidates.find((e) => e.id === requested)?.id ?? candidates[0]?.id ?? null

  const items = candidates.map((e) => ({ value: e.id, label: fullName(e) }))

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organigrama</h1>
          <p className="text-muted-foreground mt-1 text-sm">Quién reporta a quién. Haz clic en una persona para ver su ficha.</p>
        </div>
        {candidates.length > 1 && rootId && (
          <FilterSelect label="Empezar desde" items={items} value={rootId} onChange={(v) => url.patch({ root: v })} className="w-full sm:w-64" />
        )}
      </header>

      <div className="bg-card rounded-xl border p-4 shadow-[var(--shadow-raised)] sm:p-6">
        {roots.isPending ? (
          <TreeSkeleton />
        ) : roots.isError ? (
          <StateBlock icon={<SearchX aria-hidden className="size-5" />} title="No se pudo cargar el organigrama" text="Revisa tu conexión e inténtalo de nuevo." action={<Button variant="outline" onClick={() => roots.refetch()}>Reintentar</Button>} />
        ) : !rootId ? (
          <StateBlock icon={<Network aria-hidden className="size-5" />} title="Aún no hay jerarquía" text="Cuando haya empleados activos sin jefe, aparecerán aquí como raíz." />
        ) : (
          <Tree rootId={rootId} />
        )}
      </div>
    </div>
  )
}

function Tree({ rootId }: { rootId: string }) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: keys.employees.tree(rootId),
    queryFn: () => getEmployeeTree(rootId),
  })

  if (isPending) return <TreeSkeleton />
  if (isError)
    return (
      <StateBlock icon={<SearchX aria-hidden className="size-5" />} title="No se pudo cargar el árbol" text="Inténtalo de nuevo." action={<Button variant="outline" onClick={() => refetch()}>Reintentar</Button>} />
    )
  return (
    <ul role="tree" aria-label="Organigrama" className="grid gap-1">
      <Node node={data} depth={0} />
    </ul>
  )
}

function Node({ node, depth }: { node: EmployeeTreeNode; depth: number }) {
  const { open: openDrawer } = useDrawer()
  const e = node.employee
  const hasReports = node.reports.length > 0
  // Los primeros niveles se abren solos; los más profundos, a petición.
  const [expanded, setExpanded] = useState(depth < 2)

  return (
    <li role="treeitem" aria-expanded={hasReports ? expanded : undefined} aria-level={depth + 1}>
      <div className="hover:bg-muted flex items-center gap-1 rounded-lg pr-2">
        {hasReports ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={expanded ? `Contraer reportes de ${fullName(e)}` : `Expandir reportes de ${fullName(e)}`}
            onClick={() => setExpanded((v) => !v)}
          >
            <ChevronRight aria-hidden className={cn('transition-transform', expanded && 'rotate-90')} />
          </Button>
        ) : (
          <span aria-hidden className="size-7 shrink-0" />
        )}
        <button
          type="button"
          onClick={() => openDrawer('employee', e.id)}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg py-1.5 text-left"
        >
          <EmployeeAvatar employee={e} className="size-8 text-xs" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{fullName(e)}</span>
            <span className="text-muted-foreground block truncate text-[13px]">
              {e.current_position?.job_title.name ?? 'Sin puesto'}
            </span>
          </span>
        </button>
        {hasReports && (
          <span className="text-muted-foreground num shrink-0 text-xs" aria-label={`${node.reports.length} reportes`}>
            {node.reports.length}
          </span>
        )}
      </div>
      {hasReports && expanded && (
        <ul role="group" className="border-border ml-[1.1rem] grid gap-1 border-l pl-3">
          {node.reports.map((r) => (
            <Node key={r.employee.id} node={r} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  )
}

function TreeSkeleton() {
  return (
    <div className="grid gap-3" aria-busy>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3" style={{ marginLeft: i === 0 ? 0 : 28 }}>
          <Skeleton className="size-8 rounded-full" />
          <div className="grid gap-1.5">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}
