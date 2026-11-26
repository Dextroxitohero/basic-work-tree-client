import type { Employee } from '@/api/types'
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar'
import { fullName } from '@/lib/format'

/** Fila clicable de una persona (avatar, nombre y puesto): se usa en listas dentro de drawers. */
export function EmployeeLink({ employee, onOpen }: { employee: Employee; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="hover:bg-muted focus-visible:bg-muted flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left"
    >
      <EmployeeAvatar employee={employee} className="size-8 text-xs" />
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium">{fullName(employee)}</span>
        <span className="text-muted-foreground block truncate text-[13px]">
          {employee.current_position?.job_title.name ?? 'Sin puesto'}
        </span>
      </span>
    </button>
  )
}
