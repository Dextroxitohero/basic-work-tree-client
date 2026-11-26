import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import type { JobTitle, JobTitleUpdate } from '@/api/types'
import { FormDrawer } from '@/components/FormDrawer'
import { FormField } from '@/components/FormField'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useDrawer } from '@/drawers/useDrawer'
import { applyApiError } from '@/lib/form-errors'
import { useCreateJobTitle, useJobTitles, useUpdateJobTitle } from './hooks'

const schema = z.object({
  name: z.string().trim().min(1, 'Escribe el nombre').max(120, 'Máximo 120 caracteres'),
  description: z.string().trim().max(1000, 'Máximo 1000 caracteres'),
  is_active: z.boolean(),
})
type Values = z.infer<typeof schema>

const FIELDS = Object.keys(schema.shape)
const ERROR_FIELDS = { job_title_name_exists: 'name' } as const

/** `id` presente = edición; ausente = alta. El catálogo es corto: se busca en la lista ya cargada. */
export function JobTitleFormDrawer({ id }: { id: string | null }) {
  const { data, isPending } = useJobTitles({})
  const { close } = useDrawer()
  const found = id ? (data?.find((t) => t.id === id) ?? null) : null

  if (id && !found) {
    return (
      <Sheet open onOpenChange={(o) => !o && close()}>
        <SheetContent className="p-6 data-[side=right]:sm:max-w-md">
          <SheetTitle>{isPending ? 'Cargando…' : 'No se encontró el puesto'}</SheetTitle>
        </SheetContent>
      </Sheet>
    )
  }
  return <JobTitleForm title={found} />
}

function JobTitleForm({ title }: { title: JobTitle | null }) {
  const editing = title !== null
  const { close } = useDrawer()
  const create = useCreateJobTitle()
  const update = useUpdateJobTitle(title?.id ?? '')

  const initial = useMemo<Values>(
    () => ({ name: title?.name ?? '', description: title?.description ?? '', is_active: title?.is_active ?? true }),
    [title],
  )
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: initial })
  const { errors, isDirty } = form.formState
  const describe = (n: keyof Values) => (errors[n] ? `${n}-error` : undefined)
  const onError = (e: unknown) => applyApiError(e, form.setError, ERROR_FIELDS, FIELDS)

  const onSubmit = form.handleSubmit((v) => {
    if (!editing) {
      create.mutate(
        { name: v.name, ...(v.description ? { description: v.description } : {}) },
        { onSuccess: close, onError },
      )
      return
    }
    const body: JobTitleUpdate = {}
    if (v.name !== initial.name) body.name = v.name
    if (v.description !== initial.description) body.description = v.description || null
    if (v.is_active !== initial.is_active) body.is_active = v.is_active
    if (Object.keys(body).length === 0) return close()
    update.mutate(body, { onSuccess: close, onError })
  })

  return (
    <FormDrawer
      title={editing ? 'Editar puesto' : 'Nuevo puesto'}
      description="Los puestos no se borran: se desactivan."
      dirty={isDirty}
      pending={create.isPending || update.isPending}
      submitLabel={editing ? 'Guardar cambios' : 'Crear puesto'}
      onSubmit={onSubmit}
      onClose={close}
    >
      <FormField id="name" label="Nombre" error={errors.name?.message}>
        <Input id="name" autoComplete="off" aria-invalid={!!errors.name} aria-describedby={describe('name')} {...form.register('name')} />
      </FormField>
      <FormField id="description" label="Descripción (opcional)" error={errors.description?.message}>
        <Textarea id="description" rows={4} aria-invalid={!!errors.description} aria-describedby={describe('description')} {...form.register('description')} />
      </FormField>
      {editing && (
        <Controller
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div>
                <label htmlFor="is_active" className="text-sm font-medium">Activo</label>
                <p className="text-muted-foreground text-[13px]">
                  Un puesto inactivo no se puede asignar. Las asignaciones existentes no cambian.
                </p>
              </div>
              <Switch id="is_active" checked={field.value} onCheckedChange={field.onChange} />
            </div>
          )}
        />
      )}
    </FormDrawer>
  )
}
