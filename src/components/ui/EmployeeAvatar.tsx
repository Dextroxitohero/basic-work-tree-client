import type { Employee } from '@/api/types'
import { initials } from '@/lib/format'
import { tintFor } from '@/lib/dept-color'
import { cn } from '@/lib/utils'

/** Iniciales sobre el tinte del departamento: identifica a la persona y su área de un vistazo. */
export function EmployeeAvatar({
  employee,
  className,
}: {
  employee: Pick<Employee, 'first_name' | 'last_name' | 'department_id'>
  className?: string
}) {
  const tint = tintFor(employee.department_id)
  return (
    <span
      aria-hidden
      style={{ background: tint.background, color: tint.color }}
      className={cn(
        'inline-grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold',
        className,
      )}
    >
      {initials(employee)}
    </span>
  )
}
