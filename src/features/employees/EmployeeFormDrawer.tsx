import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import type { EmployeeCreate, EmployeeDetail, EmployeeUpdate } from '@/api/types'
import { EmployeePicker } from '@/components/EmployeePicker'
import { FormDrawer } from '@/components/FormDrawer'
import { FormField } from '@/components/FormField'
import { OptionSelect } from '@/components/OptionSelect'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useDepartments } from '@/features/departments/hooks'
import { useDrawer } from '@/drawers/useDrawer'
import { applyApiError } from '@/lib/form-errors'
import { useCreateEmployee, useUpdateEmployee } from './mutations'
import { useEmployee } from './hooks'

const today = () => format(new Date(), 'yyyy-MM-dd')

// En edición, email y fecha de ingreso no se pueden cambiar: no se validan (un email que
// la API aceptó puede no pasar el `.email()` de zod, y eso bloquearía guardar otros cambios).
const makeSchema = (editing: boolean) =>
  z.object({
    first_name: z.string().trim().min(1, 'Escribe el nombre').max(80, 'Máximo 80 caracteres'),
    last_name: z.string().trim().min(1, 'Escribe el apellido').max(80, 'Máximo 80 caracteres'),
    email: editing ? z.string() : z.string().trim().min(1, 'Escribe el email').email('El email no es válido'),
    phone: z.string().trim().max(20, 'Máximo 20 caracteres'),
    hire_date: editing
      ? z.string()
      : z
          .string()
          .min(1, 'Elige la fecha de ingreso')
          .refine((d) => d <= today(), 'La fecha de ingreso no puede ser futura'),
    manager_id: z.string(),
    department_id: z.string(),
  })
const schema = makeSchema(false)
type Values = z.infer<typeof schema>

const FIELDS = Object.keys(schema.shape)
const ERROR_FIELDS = {
  email_already_exists: 'email',
  inactive_manager: 'manager_id',
  circular_manager_reference: 'manager_id',
  employee_not_found: 'manager_id',
  department_not_found: 'department_id',
} as const

/** `id` presente = edición; ausente = alta. */
export function EmployeeFormDrawer({ id }: { id: string | null }) {
  const { data, isPending, isError } = useEmployee(id)
  const { close } = useDrawer()

  if (id && (isPending || isError)) {
    return (
      <Sheet open onOpenChange={(o) => !o && close()}>
        <SheetContent className="gap-0 p-6 data-[side=right]:sm:max-w-md">
          <SheetTitle>{isError ? 'No se pudo cargar el empleado' : 'Cargando…'}</SheetTitle>
          {isPending && <Skeleton className="mt-6 h-48 w-full" />}
        </SheetContent>
      </Sheet>
    )
  }
  return <EmployeeForm employee={id ? (data ?? null) : null} />
}

function EmployeeForm({ employee }: { employee: EmployeeDetail | null }) {
  const editing = employee !== null
  const { open, close } = useDrawer()
  const departments = useDepartments()
  const create = useCreateEmployee()
  const update = useUpdateEmployee(employee?.id ?? '')

  const initial = useMemo<Values>(
    () => ({
      first_name: employee?.first_name ?? '',
      last_name: employee?.last_name ?? '',
      email: employee?.email ?? '',
      phone: employee?.phone ?? '',
      hire_date: employee?.hire_date ?? '',
      manager_id: employee?.manager_id ?? '',
      department_id: employee?.department_id ?? '',
    }),
    [employee],
  )

  const form = useForm<Values>({ resolver: zodResolver(makeSchema(editing)), defaultValues: initial })
  const { errors, isDirty } = form.formState
  const pending = create.isPending || update.isPending

  const deptOptions = [
    { value: 'none', label: 'Sin departamento' },
    ...(departments.data ?? []).map((d) => ({ value: d.id, label: d.name })),
  ]

  // Tras guardar, la edición vuelve a la ficha; el alta abre la ficha del nuevo empleado.
  function done(id: string) {
    open('employee', id)
  }

  const onSubmit = form.handleSubmit((v) => {
    if (!editing) {
      const body: EmployeeCreate = {
        first_name: v.first_name,
        last_name: v.last_name,
        email: v.email,
        hire_date: v.hire_date,
        ...(v.phone ? { phone: v.phone } : {}),
        ...(v.manager_id ? { manager_id: v.manager_id } : {}),
        ...(v.department_id ? { department_id: v.department_id } : {}),
      }
      create.mutate(body, {
        onSuccess: (created) => done(created.id),
        onError: (e) => applyApiError(e, form.setError, ERROR_FIELDS, FIELDS),
      })
      return
    }

    // PATCH: solo los campos que cambiaron. `null` borra el valor.
    const body: EmployeeUpdate = {}
    if (v.first_name !== initial.first_name) body.first_name = v.first_name
    if (v.last_name !== initial.last_name) body.last_name = v.last_name
    if (v.phone !== initial.phone) body.phone = v.phone || null
    if (v.manager_id !== initial.manager_id) body.manager_id = v.manager_id || null
    if (v.department_id !== initial.department_id) body.department_id = v.department_id || null
    if (Object.keys(body).length === 0) return done(employee.id)

    update.mutate(body, {
      onSuccess: () => done(employee.id),
      onError: (e) => applyApiError(e, form.setError, ERROR_FIELDS, FIELDS),
    })
  })

  const describe = (name: keyof Values) => (errors[name] ? `${name}-error` : undefined)

  return (
    <FormDrawer
      title={editing ? 'Editar empleado' : 'Nuevo empleado'}
      description={editing ? 'El email y la fecha de ingreso no se pueden cambiar.' : 'Se dará de alta como empleado activo.'}
      dirty={isDirty}
      pending={pending}
      submitLabel={editing ? 'Guardar cambios' : 'Crear empleado'}
      onSubmit={onSubmit}
      onClose={() => (editing ? open('employee', employee.id) : close())}
    >
      <div className="grid grid-cols-2 gap-3">
        <FormField id="first_name" label="Nombre" error={errors.first_name?.message}>
          <Input id="first_name" autoComplete="off" aria-invalid={!!errors.first_name} aria-describedby={describe('first_name')} {...form.register('first_name')} />
        </FormField>
        <FormField id="last_name" label="Apellido" error={errors.last_name?.message}>
          <Input id="last_name" autoComplete="off" aria-invalid={!!errors.last_name} aria-describedby={describe('last_name')} {...form.register('last_name')} />
        </FormField>
      </div>

      <FormField id="email" label="Email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="off" readOnly={editing} className={editing ? 'bg-muted text-muted-foreground' : undefined} aria-invalid={!!errors.email} aria-describedby={describe('email')} {...form.register('email')} />
      </FormField>

      <FormField id="phone" label="Teléfono (opcional)" error={errors.phone?.message}>
        <Input id="phone" type="tel" autoComplete="off" aria-invalid={!!errors.phone} aria-describedby={describe('phone')} {...form.register('phone')} />
      </FormField>

      <FormField id="hire_date" label="Fecha de ingreso" error={errors.hire_date?.message}>
        <Input id="hire_date" type="date" max={today()} readOnly={editing} className={editing ? 'bg-muted text-muted-foreground' : undefined} aria-invalid={!!errors.hire_date} aria-describedby={describe('hire_date')} {...form.register('hire_date')} />
      </FormField>

      <FormField id="department_id" label="Departamento (opcional)" error={errors.department_id?.message}>
        <Controller
          control={form.control}
          name="department_id"
          render={({ field }) => (
            <OptionSelect
              id="department_id"
              value={field.value || 'none'}
              onChange={(v) => field.onChange(v === 'none' ? '' : v)}
              options={deptOptions}
              placeholder="Sin departamento"
              invalid={!!errors.department_id}
              describedBy={describe('department_id')}
            />
          )}
        />
      </FormField>

      <FormField id="manager_id" label="Jefe (opcional)" error={errors.manager_id?.message} hint="Solo empleados activos. La API rechaza jerarquías circulares.">
        <Controller
          control={form.control}
          name="manager_id"
          render={({ field }) => (
            <EmployeePicker
              id="manager_id"
              value={field.value}
              onChange={field.onChange}
              excludeId={employee?.id}
              placeholder="Sin jefe"
              invalid={!!errors.manager_id}
              describedBy={describe('manager_id')}
            />
          )}
        />
      </FormField>
    </FormDrawer>
  )
}
