import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

/** Etiqueta + control + error asociado. El control debe usar `id` y `aria-describedby={`${id}-error`}`. */
export function FormField({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-muted-foreground text-[13px]">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-destructive text-[13px]">
          {error}
        </p>
      )}
    </div>
  )
}
