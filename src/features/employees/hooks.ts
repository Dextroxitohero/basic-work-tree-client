import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getEmployee, listEmployees } from '@/api/employees'
import { keys } from '@/api/keys'
import type { EmployeeListParams, UUID } from '@/api/types'

/** Lista paginada por cursor: cada «Cargar más» pide la página siguiente. */
export function useEmployeeList(params: EmployeeListParams) {
  return useInfiniteQuery({
    queryKey: keys.employees.list(params),
    queryFn: ({ pageParam }) => listEmployees(params, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    // Al cambiar filtros se mantiene la tabla anterior mientras llega la nueva.
    placeholderData: keepPreviousData,
  })
}

export function useEmployee(id: UUID | null) {
  return useQuery({
    queryKey: keys.employees.detail(id ?? ''),
    queryFn: () => getEmployee(id as UUID),
    enabled: id !== null,
  })
}
