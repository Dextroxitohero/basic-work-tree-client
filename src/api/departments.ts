import { cleanParams, http } from './client'
import type {
  Department,
  DepartmentCreate,
  DepartmentListParams,
  DepartmentUpdate,
  Page,
  UUID,
} from './types'

export async function listDepartments(
  params: DepartmentListParams,
  cursor?: string,
): Promise<Page<Department>> {
  const { data } = await http.get<Page<Department>>('/departments', {
    params: cleanParams({ ...params, after: cursor }),
  })
  return data
}

export async function getDepartment(id: UUID): Promise<Department> {
  return (await http.get<Department>(`/departments/${id}`)).data
}

export async function createDepartment(body: DepartmentCreate): Promise<Department> {
  return (await http.post<Department>('/departments', body)).data
}

export async function updateDepartment(id: UUID, body: DepartmentUpdate): Promise<Department> {
  return (await http.patch<Department>(`/departments/${id}`, body)).data
}
