# Módulo `lib` (utilidades, stores y hooks compartidos)

Piezas comunes sin lógica de negocio. Cubre `src/lib/`, `src/stores/` y `src/hooks/`.

## Archivos

| Archivo | Contenido |
|---|---|
| `lib/notify.ts` | Wrapper de Sileo: `notify.success/error/info/warning/promise` y `notifyApiError` |
| `lib/query-client.ts` | `QueryClient` con `onError` global y política de reintentos |
| `lib/form-errors.ts` | `applyApiError`: lleva un error de la API al campo del formulario; solo toastea 409/422 sin campo (el resto ya lo hace el toast global) |
| `components/StatusPill.tsx` | Estado en píldora con punto (`ok`, `warn`, `risk`, `neutral`) |
| `lib/format.ts` | `fullName`, `initials`, `formatDate` (es), `formatSalary` |
| `lib/dept-color.ts` | `hueFor`, `tintFor`: tono estable por departamento |
| `lib/utils.ts` | `cn()` de shadcn |
| `stores/ui.ts` | `useUiStore`: `hideSalaries`, persistido en `localStorage` |
| `hooks/useUrlState.ts` | `get`/`patch` sobre search params |

## Notificaciones

Todo toast pasa por `notify`: si se cambia de librería, solo se toca este archivo. API de Sileo usada: `sileo.success|error|info|warning({title, description})` y `sileo.promise`. `<Toaster />` y `sileo/styles.css` se montan una vez (`App.tsx`, `main.tsx`).

`notifyApiError` traduce códigos transversales: `insufficient_permissions`, `auth_provider_unavailable`, `network_error`, `internal_error`.

## Query client

| Opción | Valor |
|---|---|
| `staleTime` | 30 s |
| `refetchOnWindowFocus` | desactivado |
| `retry` | Solo si es `ApiRequestError` con status ≥ 500, máx. 2 |
| `onError` global (query y mutation) | Toast, **excepto** 401 (cierra sesión), 409 y 422 (van al formulario) |

## Formato

- Fechas con `date-fns` y locale `es` (`4 mar 2019`).
- `formatSalary` agrupa miles siempre (`5.400,00`) y **no añade símbolo de divisa**: la API no la define. Solo para mostrar; el salario viaja como `string`.

## Color de departamento

`hueFor(id)` aplica un hash estable al id; `tintFor` devuelve fondo claro, texto oscuro y color de punto con contraste suficiente. Se usa en `EmployeeAvatar` y en el punto de departamento de la tabla.

## Estado de UI

`useUiStore` solo guarda preferencias del cliente (`hideSalaries`). Los datos del servidor no se guardan en stores.

## URL como estado

`useUrlState().patch({ clave: valor })` fija o borra claves (`undefined` o `''` las borran). Filtros, búsqueda, orden, vista, drawer y pestaña viven en la URL, no en Zustand.
