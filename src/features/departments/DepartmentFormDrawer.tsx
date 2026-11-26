import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Department, DepartmentUpdate } from '@/api/types'
import { EmployeePicker } from '@/components/EmployeePicker'
import { FormDrawer } from '@/components/FormDrawer'
import { FormField } from '@/components/FormField'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useDrawer } from '@/drawers/useDrawer'
import { applyApiError } from '@/lib/form-errors'
import { useCreateDepartment, useDepartment, useUpdateDepartment } from './hooks'

const schema = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre').max(100, 'Máximo 100 caracteres'),
  manager_id: z.string(),
})
type Values = z.infer<typeof schema>

const FIELDS = Object.keys(schema.shape)
const ERROR_FIELDS = {
  department_name_exists: 'name',
  inactive_manager: 'manager_id',
  employee_not_found: 'manager_id',
} as const

/** `id` presente = edición; ausente = alta. */
export function DepartmentFormDrawer({ id }: { id: string | null }) {
  const { data, isPending, isError } = useDepartment(id)
  const { close } = useDrawer()

  if (id && (isPending || isError)) {
    return (
      <Sheet open onOpenChange={(o) => !o && close()}>
        <SheetContent className="p-6 data-[side=right]:sm:max-w-md">
          <SheetTitle>{isError ? 'No se pudo cargar el departamento' : 'Cargando…'}</SheetTitle>
          {isPending && <Skeleton className="mt-6 h-32 w-full" />}
        </SheetContent>
      </Sheet>
    )
  }
  return <DepartmentForm department={id ? (data ?? null) : null} />
}

function DepartmentForm({ department }: { department: Department | null }) {
  const editing = department !== null
  const { open, close } = useDrawer()
  const create = useCreateDepartment()
  const update = useUpdateDepartment(department?.id ?? '')

  const initial = useMemo<Values>(
    () => ({ name: department?.name ?? '', manager_id: department?.manager_id ?? '' }),
    [department],
  )
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: initial })
  const { errors, isDirty } = form.formState
  const describe = (n: keyof Values) => (errors[n] ? `${n}-error` : undefined)

  const onError = (e: unknown) => applyApiError(e, form.setError, ERROR_FIELDS, FIELDS)

  const onSubmit = form.handleSubmit((v) => {
    if (!editing) {
      create.mutate(
        { name: v.name, ...(v.manager_id ? { manager_id: v.manager_id } : {}) },
        { onSuccess: (created) => open('department', created.id), onError },
      )
      return
    }
    const body: DepartmentUpdate = {}
    if (v.name !== initial.name) body.name = v.name
    if (v.manager_id !== initial.manager_id) body.manager_id = v.manager_id || null
    if (Object.keys(body).length === 0) return open('department', department.id)
    update.mutate(body, { onSuccess: () => open('department', department.id), onError })
  })

  return (
    <FormDrawer
      title={editing ? 'Editar departamento' : 'Nuevo departamento'}
      dirty={isDirty}
      pending={create.isPending || update.isPending}
      submitLabel={editing ? 'Guardar cambios' : 'Crear departamento'}
      onSubmit={onSubmit}
      onClose={() => (editing ? open('department', department.id) : close())}
    >
      <FormField id="name" label="Nombre" error={errors.name?.message}>
        <Input id="name" autoComplete="off" aria-invalid={!!errors.name} aria-describedby={describe('name')} {...form.register('name')} />
      </FormField>
      <FormField id="manager_id" label="Encargado (opcional)" error={errors.manager_id?.message} hint="Solo empleados activos.">
        <Controller
          control={form.control}
          name="manager_id"
          render={({ field }) => (
            <EmployeePicker
              id="manager_id"
              value={field.value}
              onChange={field.onChange}
              placeholder="Sin encargado"
              invalid={!!errors.manager_id}
              describedBy={describe('manager_id')}
            />
          )}
        />
      </FormField>
    </FormDrawer>
  )
}
