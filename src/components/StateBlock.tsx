import type { ReactNode } from 'react'

/** Estado vacío, de error o sin permiso: icono, mensaje y, si aplica, una acción. */
export function StateBlock({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode
  title: string
  text: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="bg-muted text-muted-foreground grid size-10 place-items-center rounded-full">{icon}</span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground mt-1 text-sm">{text}</p>
      </div>
      {action}
    </div>
  )
}
