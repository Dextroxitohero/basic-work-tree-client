import { Bell, CheckCircle2, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuthStore } from '@/features/auth/store'
import { useAttention } from '@/features/today/useAttention'
import { cn } from '@/lib/utils'

/** Campana con los pendientes (los mismos de «Hoy») y menú de perfil. */
export function HeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <NotificationsMenu />
      <ProfileMenu />
    </div>
  )
}

function NotificationsMenu() {
  const [open, setOpen] = useState(false)
  const { items, isPending } = useAttention()
  const count = items.length

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="bg-card relative size-10 rounded-full"
            aria-label={count > 0 ? `Pendientes: ${count}` : 'Sin pendientes'}
          />
        }
      >
        <Bell aria-hidden />
        {count > 0 && (
          <span aria-hidden className="bg-violet num absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full px-1 text-[11px] leading-5 font-semibold text-white">
            {count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] gap-0 rounded-2xl p-0 shadow-[var(--shadow-overlay)]">
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <h2 className="text-sm font-semibold">Pendientes</h2>
          {count > 0 && <span className="bg-violet num rounded-full px-2 py-0.5 text-xs font-semibold text-white">{count}</span>}
        </div>
        {isPending ? (
          <p className="text-muted-foreground px-4 pb-5 text-sm">Revisando…</p>
        ) : count === 0 ? (
          <div className="text-muted-foreground flex items-center gap-2 px-4 pb-5 text-sm">
            <CheckCircle2 aria-hidden className="text-ok size-4" /> Todo en orden.
          </div>
        ) : (
          <ul className="max-h-96 divide-y overflow-y-auto border-t">
            {items.map((item) => (
              <li key={item.id} className="px-4 py-3">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-muted-foreground mt-0.5 text-[13px]">{item.detail}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setOpen(false)
                    item.action.run()
                  }}
                >
                  {item.action.label}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}

function ProfileMenu() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const name = user?.full_name || user?.email || 'Sesión activa'

  return (
    <Popover>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={`Cuenta de ${name}`}
            className="bg-card hover:bg-accent flex h-10 items-center gap-2.5 rounded-full border py-1 pr-3 pl-1 transition-colors"
          />
        }
      >
        <span aria-hidden className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-full text-xs font-semibold">
          {name.slice(0, 2).toUpperCase()}
        </span>
        <span className="hidden max-w-36 truncate text-sm font-medium lg:block">{name}</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 gap-0 rounded-2xl p-2 shadow-[var(--shadow-overlay)]">
        <div className="px-2 py-2">
          <p className="truncate text-sm font-medium">{name}</p>
          {user?.full_name && <p className="text-muted-foreground truncate text-[13px]">{user.email}</p>}
          <p className={cn('text-muted-foreground num mt-2 text-xs')}>
            {user?.permissions.length ?? 0} {user?.permissions.length === 1 ? 'permiso' : 'permisos'}
          </p>
        </div>
        <Button variant="ghost" className="mt-1 w-full justify-start" onClick={logout}>
          <LogOut aria-hidden /> Cerrar sesión
        </Button>
      </PopoverContent>
    </Popover>
  )
}
