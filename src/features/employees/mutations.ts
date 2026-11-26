import { useMutation, useQueryClient } from '@tanstack/react-query'
import { keys } from '@/api/keys'
import { assignPosition, createEmployee, deactivateEmployee, updateEmployee } from '@/api/employees'
import type { EmployeeCreate, EmployeeUpdate, PositionCreate, UUID } from '@/api/types'
import { notify } from '@/lib/notify'

export function useCreateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: EmployeeCreate) => createEmployee(body),
    onSuccess: (employee) => {
      void qc.invalidateQueries({ queryKey: keys.employees.all })
      // Un nuevo jefe o departamento cambia el contador de departamentos.
      void qc.invalidateQueries({ queryKey: keys.departments.all })
      notify.success('Empleado creado', `${employee.first_name} ${employee.last_name}`)
    },
  })
}

export function useUpdateEmployee(id: UUID) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: EmployeeUpdate) => updateEmployee(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.employees.all })
      void qc.invalidateQueries({ queryKey: keys.departments.all })
      notify.success('Cambios guardados')
    },
  })
}

/** La baja deja sin jefe a sus subordinados y sin encargado a sus departamentos. */
export function useDeactivateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: UUID) => deactivateEmployee(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.employees.all })
      void qc.invalidateQueries({ queryKey: keys.departments.all })
      notify.success('Empleado dado de baja')
    },
  })
}

export function useReactivateEmployee() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: UUID) => updateEmployee(id, { is_active: true }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.employees.all })
      void qc.invalidateQueries({ queryKey: keys.departments.all })
      notify.success('Empleado reactivado')
    },
  })
}

export function useAssignPosition(employeeId: UUID) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: PositionCreate) => assignPosition(employeeId, body),
    onSuccess: () => {
      // Cambia current_position y se cierra el puesto anterior.
      void qc.invalidateQueries({ queryKey: keys.employees.all })
      notify.success('Puesto asignado')
    },
  })
}
