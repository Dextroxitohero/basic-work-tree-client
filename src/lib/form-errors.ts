import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { ApiRequestError } from '@/api/errors'
import { notifyApiError } from '@/lib/notify'

/**
 * Lleva un error de la API al campo del formulario que lo causó.
 *
 * - `fieldByCode`: código de error → campo (p. ej. `email_already_exists` → `email`).
 * - Un 422 se mapea por la última parte de `loc`.
 * - Un 409/422 que no se pueda asignar a un campo se muestra como toast. El resto de
 *   errores (403, 5xx, red) ya los muestra el toast global de Query: aquí no se duplican.
 */
export function applyApiError<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fieldByCode: Record<string, Path<T>> = {},
  fields: readonly string[] = [],
): void {
  if (!(error instanceof ApiRequestError)) return

  const byCode = fieldByCode[error.code]
  if (byCode) {
    setError(byCode, { message: error.message })
    return
  }

  if (error.status === 422) {
    let mapped = false
    for (const detail of error.validation) {
      const field = detail.loc[detail.loc.length - 1]
      if (typeof field === 'string' && fields.includes(field)) {
        setError(field as Path<T>, { message: detail.msg })
        mapped = true
      }
    }
    if (mapped) return
  }

  if (error.status === 409 || error.status === 422) notifyApiError(error)
}
