import { keepPreviousData, useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createDepartment, getDepartment, listDepartments, updateDepartment } from '@/api/departments'
import { keys } from '@/api/keys'
import type {
  Department,
  DepartmentCreate,
  DepartmentListParams,
  DepartmentUpdate,
  UUID,
} from '@/api/types'
import { notify } from '@/lib/notify'

/** Lista paginada para la vista de departamentos. */
export function useDepartmentList(params: DepartmentListParams) {
  return useInfiniteQuery({
    queryKey: keys.departments.list(params),
    queryFn: ({ pageParam }) => listDepartments(params, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    placeholderData: keepPreviousData,
  })
}

export function useDepartment(id: UUID | null) {
  return useQuery({
    queryKey: keys.departments.detail(id ?? ''),
    queryFn: () => getDepartment(id as UUID),
    enabled: id !== null,
  })
}

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

export function useCreateDepartment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: DepartmentCreate) => createDepartment(body),
    onSuccess: (department) => {
      void qc.invalidateQueries({ queryKey: keys.departments.all })
      notify.success('Departamento creado', department.name)
    },
  })
}

export function useUpdateDepartment(id: UUID) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: DepartmentUpdate) => updateDepartment(id, body),
    onSuccess: (_, body) => {
      void qc.invalidateQueries({ queryKey: keys.departments.all })
      // Cambiar el encargado no toca a los empleados, pero conviene mantener la ficha al día.
      if ('manager_id' in body) void qc.invalidateQueries({ queryKey: keys.employees.all })
      notify.success('Cambios guardados')
    },
  })
}
