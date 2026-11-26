export type UUID = string
export type ISODate = string // "2025-03-01"
export type ISODateTime = string // "2025-03-01T10:00:00Z"
/** Decimal serializado como texto ("1500.50"). Nunca convertir a number para operar. */
export type Money = string

export interface ApiError {
  error: string
  message: string
  details?: unknown
}

/** Respuesta paginada por cursor. `next_cursor` es null en la última página. */
export interface Page<T> {
  items: T[]
  next_cursor: string | null
}

export type SortOrder = 'asc' | 'desc'

// ---- Puestos (catálogo) ----
export interface JobTitle {
  id: UUID
  name: string
  description: string | null
  is_active: boolean
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface JobTitleCreate {
  name: string
  description?: string | null
}

export interface JobTitleUpdate {
  name?: string
  description?: string | null
  is_active?: boolean
}

export interface JobTitleListParams {
  q?: string
  is_active?: boolean
  sort?: 'name'
  order?: SortOrder
}

// ---- Historial de puestos ----
export interface PositionSummary {
  job_title: JobTitle
  salary: Money
  start_date: ISODate
}

export interface PositionHistory {
  id: UUID
  employee_id: UUID
  job_title: JobTitle
  salary: Money
  start_date: ISODate
  end_date: ISODate | null
  notes: string | null
  created_at: ISODateTime
}

export interface PositionCreate {
  job_title_id: UUID
  salary: Money
  start_date: ISODate
  notes?: string | null
}

// ---- Empleados ----
export interface Employee {
  id: UUID
  first_name: string
  last_name: string
  email: string
  phone: string | null
  hire_date: ISODate
  is_active: boolean
  manager_id: UUID | null
  department_id: UUID | null
  current_position: PositionSummary | null
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface EmployeeDetail extends Employee {
  position_history: PositionHistory[]
  direct_reports: Employee[]
}

export interface EmployeeTreeNode {
  employee: Employee
  reports: EmployeeTreeNode[]
}

export interface EmployeeCreate {
  first_name: string
  last_name: string
  email: string
  phone?: string | null
  hire_date: ISODate
  manager_id?: UUID | null
  department_id?: UUID | null
}

export interface EmployeeUpdate {
  first_name?: string
  last_name?: string
  phone?: string | null
  manager_id?: UUID | null
  department_id?: UUID | null
  is_active?: boolean
}

export type EmployeeSort = 'last_name' | 'first_name' | 'hire_date' | 'created_at'

export interface EmployeeListParams {
  q?: string
  is_active?: boolean
  department_id?: UUID
  manager_id?: UUID
  has_manager?: boolean
  job_title_id?: UUID
  sort?: EmployeeSort
  order?: SortOrder
}

// ---- Departamentos ----
export interface Department {
  id: UUID
  name: string
  manager_id: UUID | null
  employee_count: number
  created_at: ISODateTime
}

export interface DepartmentCreate {
  name: string
  manager_id?: UUID | null
}

export interface DepartmentUpdate {
  name?: string
  manager_id?: UUID | null
}

export interface DepartmentListParams {
  q?: string
  sort?: 'name' | 'created_at'
  order?: SortOrder
}
