import { Check, ChevronsUpDown, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { EmployeeAvatar } from '@/components/ui/EmployeeAvatar'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useEmployee, useEmployeeList } from '@/features/employees/hooks'
import { fullName } from '@/lib/format'

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(id)
  }, [value, ms])
  return debounced
}

/** Selector de empleado activo con búsqueda en el servidor. `value` vacío = nadie. */
export function EmployeePicker({
  id,
  value,
  onChange,
  excludeId,
  placeholder = 'Elegir empleado',
  invalid,
  describedBy,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  /** Empleado que no se puede elegir (p. ej. uno mismo como jefe). */
  excludeId?: string
  placeholder?: string
  invalid?: boolean
  describedBy?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const q = useDebounced(search.trim(), 250)

  const selected = useEmployee(value || null)
  const list = useEmployeeList({ q: q || undefined, is_active: true, sort: 'last_name', order: 'asc' })
  const options = useMemo(
    () => (list.data?.pages.flatMap((p) => p.items) ?? []).filter((e) => e.id !== excludeId),
    [list.data, excludeId],
  )

  return (
    <div className="flex gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-invalid={invalid}
              aria-describedby={describedBy}
              className="h-9 min-w-0 flex-1 justify-between font-normal"
            />
          }
        >
          {value && selected.data ? (
            <span className="flex min-w-0 items-center gap-2">
              <EmployeeAvatar employee={selected.data} className="size-5 text-[10px]" />
              <span className="truncate">{fullName(selected.data)}</span>
            </span>
          ) : value ? (
            <span className="text-muted-foreground">Cargando…</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown aria-hidden className="text-muted-foreground size-4 shrink-0" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--anchor-width)] min-w-64 p-0">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Buscar por nombre o email" value={search} onValueChange={setSearch} />
            <CommandList>
              {list.isPending ? (
                <p className="text-muted-foreground px-3 py-4 text-sm">Buscando…</p>
              ) : (
                <>
                  <CommandEmpty>Nadie coincide con la búsqueda.</CommandEmpty>
                  <CommandGroup>
                    {options.map((e) => (
                      <CommandItem
                        key={e.id}
                        value={e.id}
                        onSelect={() => {
                          onChange(e.id)
                          setOpen(false)
                        }}
                      >
                        <EmployeeAvatar employee={e} className="size-6 text-[10px]" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{fullName(e)}</span>
                          <span className="text-muted-foreground block truncate text-xs">{e.email}</span>
                        </span>
                        {e.id === value && <Check aria-hidden className="size-4" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {list.hasNextPage && (
                    <div className="border-t p-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => list.fetchNextPage()}
                        disabled={list.isFetchingNextPage}
                      >
                        {list.isFetchingNextPage ? 'Cargando…' : 'Mostrar más'}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <Button type="button" variant="ghost" size="icon" aria-label="Quitar selección" onClick={() => onChange('')}>
          <X aria-hidden />
        </Button>
      )}
    </div>
  )
}
