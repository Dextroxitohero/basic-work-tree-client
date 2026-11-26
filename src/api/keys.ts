import type {
  DepartmentListParams,
  EmployeeListParams,
  JobTitleListParams,
  UUID,
} from './types'

export const keys = {
  employees: {
    all: ['employees'] as const,
    list: (params: EmployeeListParams) => ['employees', 'list', params] as const,
    detail: (id: UUID) => ['employees', 'detail', id] as const,
    reports: (id: UUID) => ['employees', id, 'reports'] as const,
    tree: (id: UUID) => ['employees', id, 'tree'] as const,
    positions: (id: UUID) => ['employees', id, 'positions'] as const,
    currentPosition: (id: UUID) => ['employees', id, 'positions', 'current'] as const,
  },
  departments: {
    all: ['departments'] as const,
    list: (params: DepartmentListParams) => ['departments', 'list', params] as const,
    detail: (id: UUID) => ['departments', 'detail', id] as const,
  },
  jobTitles: {
    all: ['job-titles'] as const,
    list: (params: JobTitleListParams) => ['job-titles', 'list', params] as const,
  },
}
