import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { FormDrawer } from '@/components/FormDrawer'
import { FormField } from '@/components/FormField'
import { OptionSelect } from '@/components/OptionSelect'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useDrawer } from '@/drawers/useDrawer'
import { useJobTitles } from '@/features/job-titles/hooks'
import { applyApiError } from '@/lib/form-errors'
import { fullName, formatDate } from '@/lib/format'
import { useEmployee } from './hooks'
import { useAssignPosition } from './mutations'

const today = () => format(new Date(), 'yyyy-MM-dd')

// Mismas reglas que la API: > 0, hasta 12 dígitos con 2 decimales. Viaja como texto.
const SALARY = /^\d{1,10}(\.\d{1,2})?$/

const schema = z.object({
  job_title_id: z.string().min(1, 'Elige un puesto'),
  salary: z
    .string()
    .trim()
    .min(1, 'Escribe el salario')
    .refine((s) => SALARY.test(s), 'Usa solo números, con hasta 2 decimales (ej. 1500.50)')
    .refine((s) => Number(s) > 0, 'El salario debe ser mayor que 0'),
  start_date: z
    .string()
    .min(1, 'Elige la fecha de inicio')
    .refine((d) => d <= today(), 'La fecha de inicio no puede ser futura'),
  notes: z.string().trim().max(500, 'Máximo 500 caracteres'),
})
type Values = z.infer<typeof schema>

const FIELDS = Object.keys(schema.shape)
const ERROR_FIELDS = {
  overlapping_position: 'start_date',
  job_title_inactive: 'job_title_id',
  job_title_not_found: 'job_title_id',
} as const

export function PositionFormDrawer({ employeeId }: { employeeId: string }) {
  const { data: employee, isPending, isError } = useEmployee(employeeId)
  const { close } = useDrawer()

  if (isPending || isError) {
    return (
      <Sheet open onOpenChange={(o) => !o && close()}>
        <SheetContent className="p-6 data-[side=right]:sm:max-w-md">
          <SheetTitle>{isError ? 'No se pudo cargar el empleado' : 'Cargando…'}</SheetTitle>
        </SheetContent>
      </Sheet>
    )
  }
  return <PositionForm employeeId={employeeId} name={fullName(employee)} currentFrom={employee.current_position?.start_date ?? null} currentName={employee.current_position?.job_title.name ?? null} active={employee.is_active} />
}

function PositionForm({
  employeeId,
  name,
  active,
  currentName,
  currentFrom,
}: {
  employeeId: string
  name: string
  active: boolean
  currentName: string | null
  currentFrom: string | null
}) {
  const { open } = useDrawer()
  const titles = useJobTitles({ is_active: true, sort: 'name', order: 'asc' })
  const assign = useAssignPosition(employeeId)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { job_title_id: '', salary: '', start_date: today(), notes: '' },
  })
  const { errors, isDirty } = form.formState
  const back = () => open('employee', employeeId)

  const onSubmit = form.handleSubmit((v) =>
    assign.mutate(
      {
        job_title_id: v.job_title_id,
        salary: v.salary,
        start_date: v.start_date,
        ...(v.notes ? { notes: v.notes } : {}),
      },
      { onSuccess: back, onError: (e) => applyApiError(e, form.setError, ERROR_FIELDS, FIELDS) },
    ),
  )

  const describe = (n: keyof Values) => (errors[n] ? `${n}-error` : undefined)
  const options = (titles.data ?? []).map((t) => ({ value: t.id, label: t.name }))

  return (
    <FormDrawer
      title="Asignar puesto"
      description={name}
      dirty={isDirty}
      pending={assign.isPending}
      submitLabel="Asignar puesto"
      submitDisabled={!active}
      onSubmit={onSubmit}
      onClose={back}
    >
      {!active && (
        <p role="alert" className="bg-destructive/8 text-destructive rounded-md px-3 py-2 text-sm">
          Este empleado está dado de baja: la API no permite asignarle un puesto.
        </p>
      )}
      {currentName && (
        <p className="bg-muted text-muted-foreground rounded-md px-3 py-2 text-sm">
          Puesto actual: <span className="text-foreground font-medium">{currentName}</span>
          {currentFrom ? <> desde <span className="num">{formatDate(currentFrom)}</span></> : null}. Se cerrará el día anterior al inicio del nuevo.
        </p>
      )}

      <FormField id="job_title_id" label="Puesto" error={errors.job_title_id?.message}>
        <Controller
          control={form.control}
          name="job_title_id"
          render={({ field }) => (
            <OptionSelect
              id="job_title_id"
              value={field.value}
              onChange={field.onChange}
              options={options}
              placeholder={titles.isPending ? 'Cargando puestos…' : 'Elegir puesto'}
              invalid={!!errors.job_title_id}
              describedBy={describe('job_title_id')}
              disabled={!active}
            />
          )}
        />
      </FormField>

      <FormField id="salary" label="Salario" error={errors.salary?.message} hint="Con punto decimal, hasta 2 decimales.">
        <Input id="salary" inputMode="decimal" autoComplete="off" disabled={!active} aria-invalid={!!errors.salary} aria-describedby={describe('salary')} className="num" {...form.register('salary')} />
      </FormField>

      <FormField id="start_date" label="Inicio" error={errors.start_date?.message}>
        <Input id="start_date" type="date" max={today()} disabled={!active} aria-invalid={!!errors.start_date} aria-describedby={describe('start_date')} {...form.register('start_date')} />
      </FormField>

      <FormField id="notes" label="Notas (opcional)" error={errors.notes?.message}>
        <Textarea id="notes" rows={3} disabled={!active} aria-invalid={!!errors.notes} aria-describedby={describe('notes')} {...form.register('notes')} />
      </FormField>
    </FormDrawer>
  )
}
