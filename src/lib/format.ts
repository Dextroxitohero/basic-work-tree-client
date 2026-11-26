import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Employee, Money } from '@/api/types'

export function fullName(e: Pick<Employee, 'first_name' | 'last_name'>): string {
  return `${e.first_name} ${e.last_name}`
}

export function initials(e: Pick<Employee, 'first_name' | 'last_name'>): string {
  return `${e.first_name[0] ?? ''}${e.last_name[0] ?? ''}`.toUpperCase()
}

export function formatDate(iso: string): string {
  return format(parseISO(iso), "d MMM yyyy", { locale: es })
}

// La API no define divisa: se muestra el número con separadores, sin símbolo inventado.
const amount = new Intl.NumberFormat('es', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' })

/** Solo para mostrar. El salario viaja como texto y no se opera con float. */
export function formatSalary(value: Money): string {
  return amount.format(Number(value))
}
