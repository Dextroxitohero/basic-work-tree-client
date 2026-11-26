import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { AuthUser } from '@/api/auth'
import { ApiRequestError } from '@/api/errors'
import { ALL_PERMISSIONS, type Permission } from '@/api/types'
import type { UserUpdate } from '@/api/users'
import { FormDrawer } from '@/components/FormDrawer'
import { Checkbox } from '@/components/ui/checkbox'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/features/auth/store'
import { notify, notifyApiError } from '@/lib/notify'
import { useUpdateUser, useUserList } from './hooks'

const PERMISSION_TEXT: Record<Permission, { label: string; detail: string }> = {
  'employees:read': { label: 'Ver empleados', detail: 'Empleados, puestos, departamentos y organigrama, incluidos los salarios.' },
  'employees:write': { label: 'Gestionar empleados', detail: 'Crear, editar y dar de baja empleados.' },
  'positions:write': { label: 'Asignar puestos', detail: 'Asignar el puesto y el salario de un empleado.' },
  'job-titles:write': { label: 'Gestionar puestos', detail: 'Crear y editar el catálogo de puestos.' },
  'departments:write': { label: 'Gestionar departamentos', detail: 'Crear y editar departamentos.' },
  'users:write': { label: 'Administrar usuarios', detail: 'Cambiar permisos y activar o desactivar cuentas.' },
}

interface Values {
  permissions: Permission[]
  is_active: boolean
}

/** La API no tiene `GET /users/{id}`: se busca en la lista, cargando páginas hasta encontrarlo. */
export function UserDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const list = useUserList({ sort: 'email', order: 'asc' })
  const user = useMemo(() => list.data?.pages.flatMap((p) => p.items).find((u) => u.id === id) ?? null, [list.data, id])

  useEffect(() => {
    if (!user && list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage()
  }, [user, list])

  if (!user) {
    const searching = list.isPending || list.hasNextPage || list.isFetchingNextPage
    return (
      <Sheet open onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="gap-3 p-6 data-[side=right]:sm:max-w-md">
          <SheetTitle>{searching ? 'Buscando usuario…' : 'No se encontró el usuario'}</SheetTitle>
          {searching ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <>
              <SheetDescription>Puede que ya no exista.</SheetDescription>
              <div>
                <Button variant="outline" onClick={onClose}>Cerrar</Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    )
  }
  return <UserForm user={user} onClose={onClose} />
}

function UserForm({ user, onClose }: { user: AuthUser; onClose: () => void }) {
  const meId = useAuthStore((s) => s.user?.id)
  const isSelf = meId === user.id
  const update = useUpdateUser(user.id)

  const initial = useMemo<Values>(() => ({ permissions: [...user.permissions].sort(), is_active: user.is_active }), [user])
  const form = useForm<Values>({ defaultValues: initial })
  const { isDirty } = form.formState

  const onSubmit = form.handleSubmit((v) => {
    const body: UserUpdate = {}
    const sorted = [...v.permissions].sort()
    if (sorted.join() !== initial.permissions.join()) body.permissions = sorted
    if (v.is_active !== initial.is_active) body.is_active = v.is_active
    if (Object.keys(body).length === 0) return onClose()

    update.mutate(body, {
      onSuccess: onClose,
      onError: (e) => {
        // El 409 y el 404 no los muestra el toast global (409) o merecen mensaje propio.
        if (e instanceof ApiRequestError && e.code === 'last_admin_required') {
          notify.error('Debe quedar un administrador', 'No puedes quitar users:write ni desactivar al último administrador activo.')
        } else if (e instanceof ApiRequestError && e.code === 'user_not_found') {
          notify.error('El usuario ya no existe')
          onClose()
        } else if (e instanceof ApiRequestError && (e.status === 409 || e.status === 422)) {
          notifyApiError(e)
        }
      },
    })
  })

  return (
    <FormDrawer
      title={user.full_name || user.email}
      description={user.full_name ? user.email : undefined}
      dirty={isDirty}
      pending={update.isPending}
      submitLabel="Guardar cambios"
      onSubmit={onSubmit}
      onClose={onClose}
    >
      {isSelf && (
        <p className="bg-muted text-muted-foreground rounded-md px-3 py-2 text-sm">
          Esta es tu cuenta: no puedes quitarte el permiso de administrar usuarios ni desactivarte.
        </p>
      )}

      <Controller
        control={form.control}
        name="is_active"
        render={({ field }) => (
          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div>
              <label htmlFor="is_active" className="text-sm font-medium">Cuenta activa</label>
              <p className="text-muted-foreground text-[13px]">Una cuenta desactivada pierde el acceso de inmediato, aunque su sesión siga vigente.</p>
            </div>
            <Switch id="is_active" checked={field.value} onCheckedChange={field.onChange} disabled={isSelf} />
          </div>
        )}
      />

      <fieldset className="grid gap-1">
        <legend className="mb-1 text-sm font-medium">Permisos</legend>
        <Controller
          control={form.control}
          name="permissions"
          render={({ field }) => (
            <>
              {ALL_PERMISSIONS.map((p) => {
                const checked = field.value.includes(p)
                const locked = isSelf && p === 'users:write'
                const text = PERMISSION_TEXT[p]
                return (
                  <div key={p} className="hover:bg-muted flex items-start gap-3 rounded-lg px-2 py-2">
                    <Checkbox
                      id={`perm-${p}`}
                      className="mt-0.5"
                      checked={checked}
                      disabled={locked}
                      onCheckedChange={(next) => field.onChange(next ? [...field.value, p] : field.value.filter((x) => x !== p))}
                    />
                    <label htmlFor={`perm-${p}`} className="grid cursor-pointer gap-0.5">
                      <span className="text-sm font-medium">{text.label}</span>
                      <span className="text-muted-foreground text-[13px]">{text.detail}</span>
                    </label>
                  </div>
                )
              })}
            </>
          )}
        />
      </fieldset>
    </FormDrawer>
  )
}
