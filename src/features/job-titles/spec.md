# Módulo `job-titles`

Catálogo de puestos de la empresa. **Pendiente de construir**; solo existen las funciones de red (`src/api/job-titles.ts`).

## Archivos previstos

| Archivo | Contenido |
|---|---|
| `JobTitlesView.tsx` | Vista `?view=job-titles`: búsqueda, filtro activos/inactivos, lista |
| `JobTitleFormDrawer.tsx` | Drawer `job-title-form`: alta, edición y desactivar |
| `hooks.ts` | `useJobTitles(params)` (query simple, el catálogo no se pagina) |
| `mutations.ts`, `schemas.ts` | Mutaciones y zod |

## Endpoints

| Método | Ruta | Entrada | Salida | Permiso |
|---|---|---|---|---|
| GET | `/job-titles` | `q`, `is_active`, `sort=name`, `order` | `JobTitle[]` | `employees:read` |
| GET | `/job-titles/{id}` | — | `JobTitle` | `employees:read` |
| POST | `/job-titles` | `JobTitleCreate` | 201 `JobTitle` | `job-titles:write` |
| PATCH | `/job-titles/{id}` | `JobTitleUpdate` | `JobTitle` | `job-titles:write` |

## Validaciones

| Campo | Regla |
|---|---|
| `name` | 1–120, sin espacios en los extremos |
| `description` | Hasta 1000, opcional |

En PATCH, `description` acepta `null`; `name` e `is_active` no.

## Reglas de negocio

| Regla | Error | En la UI |
|---|---|---|
| El nombre es único, también entre inactivos | 409 `job_title_name_exists` | Error en `name` |
| Un puesto inactivo no se puede asignar | 409 `job_title_inactive` | El selector de «Asignar puesto» solo ofrece activos |

- **No hay borrado**, solo desactivar. Desactivar no afecta a las asignaciones existentes.
- `is_active` omitido devuelve activos e inactivos; el cliente lo envía explícito al filtrar.
- Invalidación: crear o editar → `jobTitles.all`.

## Uso desde otros módulos

El drawer de asignar puesto (`employees`) lee los puestos activos con `useJobTitles({ is_active: true })`.
