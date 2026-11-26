import { cleanParams, http } from './client'
import { ApiRequestError } from './errors'
import type {
  Employee,
  EmployeeCreate,
  EmployeeDetail,
  EmployeeListParams,
  EmployeeTreeNode,
  EmployeeUpdate,
  Page,
  PositionCreate,
  PositionHistory,
  UUID,
} from './types'

export async function listEmployees(
  params: EmployeeListParams,
  cursor?: string,
): Promise<Page<Employee>> {
  const { data } = await http.get<Page<Employee>>('/employees', {
    params: cleanParams({ ...params, after: cursor }),
  })
  return data
}

export async function getEmployee(id: UUID): Promise<EmployeeDetail> {
  return (await http.get<EmployeeDetail>(`/employees/${id}`)).data
}

export async function createEmployee(body: EmployeeCreate): Promise<Employee> {
  return (await http.post<Employee>('/employees', body)).data
}

export async function updateEmployee(id: UUID, body: EmployeeUpdate): Promise<Employee> {
  return (await http.patch<Employee>(`/employees/${id}`, body)).data
}

export async function deactivateEmployee(id: UUID): Promise<void> {
  await http.delete(`/employees/${id}`)
}

export async function getEmployeeTree(id: UUID): Promise<EmployeeTreeNode> {
  return (await http.get<EmployeeTreeNode>(`/employees/${id}/tree`)).data
}

export async function listPositions(id: UUID): Promise<PositionHistory[]> {
  return (await http.get<PositionHistory[]>(`/employees/${id}/positions`)).data
}

/** `no_active_position` (404) no es un error de UI: significa «sin puesto actual». */
export async function getCurrentPosition(id: UUID): Promise<PositionHistory | null> {
  try {
    return (await http.get<PositionHistory>(`/employees/${id}/positions/current`)).data
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === 'no_active_position') return null
    throw error
  }
}

export async function assignPosition(id: UUID, body: PositionCreate): Promise<PositionHistory> {
  return (await http.post<PositionHistory>(`/employees/${id}/positions`, body)).data
}
