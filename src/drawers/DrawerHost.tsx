import { DepartmentDrawer } from '@/features/departments/DepartmentDrawer'
import { DepartmentFormDrawer } from '@/features/departments/DepartmentFormDrawer'
import { useCan } from '@/features/auth/store'
import { EmployeeDrawer } from '@/features/employees/EmployeeDrawer'
import { EmployeeFormDrawer } from '@/features/employees/EmployeeFormDrawer'
import { PositionFormDrawer } from '@/features/employees/PositionFormDrawer'
import { JobTitleFormDrawer } from '@/features/job-titles/JobTitleFormDrawer'
import { useDrawer } from './useDrawer'

/** Lee `?drawer=` e `?id=` y monta el drawer correspondiente. Único punto de montaje. */
export function DrawerHost() {
  const { drawer, id, close } = useDrawer()
  const canEmployees = useCan('employees:write')
  const canPositions = useCan('positions:write')
  const canDepartments = useCan('departments:write')
  const canJobTitles = useCan('job-titles:write')

  // Los formularios solo se abren con permiso de escritura; la API lo exige de todos modos.
  switch (drawer) {
    case 'employee':
      return id ? <EmployeeDrawer key={id} id={id} onClose={close} /> : null
    case 'employee-form':
      return canEmployees ? <EmployeeFormDrawer key={id ?? 'new'} id={id} /> : null
    case 'position-form':
      return canPositions && id ? <PositionFormDrawer key={id} employeeId={id} /> : null
    case 'department':
      return id ? <DepartmentDrawer key={id} id={id} onClose={close} /> : null
    case 'department-form':
      return canDepartments ? <DepartmentFormDrawer key={id ?? 'new'} id={id} /> : null
    case 'job-title-form':
      return canJobTitles ? <JobTitleFormDrawer key={id ?? 'new'} id={id} /> : null
    default:
      return null
  }
}
