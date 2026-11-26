import { useQuery } from '@tanstack/react-query'
import { listDepartments } from '@/api/departments'
import { keys } from '@/api/keys'
import type { Department, UUID } from '@/api/types'

/** Todos los departamentos (son pocos): recorre el cursor hasta agotarlo. */
async function fetchAllDepartments(): Promise<Department[]> {
  const all: Department[] = []
  let cursor: string | undefined
  do {
    const page = await listDepartments({ sort: 'name', order: 'asc' }, cursor)
    all.push(...page.items)
    cursor = page.next_cursor ?? undefined
  } while (cursor)
  return all
}

export function useDepartments() {
  return useQuery({
    queryKey: [...keys.departments.all, 'all'],
    queryFn: fetchAllDepartments,
    staleTime: 5 * 60_000,
  })
}

export function useDepartmentNames(): (id: UUID | null) => string | null {
  const { data } = useDepartments()
  const byId = new Map((data ?? []).map((d) => [d.id, d.name]))
  return (id) => (id ? (byId.get(id) ?? null) : null)
}
