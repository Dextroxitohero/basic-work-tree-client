# Módulo `api`

Capa de red. Funciones puras sin React: reciben parámetros, devuelven datos tipados o lanzan `ApiRequestError`. No conoce a ninguna feature.

## Archivos

| Archivo | Contenido |
|---|---|
| `client.ts` | Instancia Axios, interceptores, `configureApiAuth`, `cleanParams` |
| `errors.ts` | `ApiRequestError`, `isApiError`, `ValidationDetail` |
| `types.ts` | Tipos de la API: entidades, bodies, `Page<T>`, parámetros de lista |
| `keys.ts` | Query keys de TanStack Query |
| `auth.ts` | `login`, `signup`, `fetchMe`, `AuthUser`, `AuthSession` |
| `users.ts` | `listUsers`, `updateUser` |
| `employees.ts` | Empleados y sus puestos (`listPositions`, `getCurrentPosition`, `assignPosition`) |
| `departments.ts` | Departamentos |
| `job-titles.ts` | Catálogo de puestos |

## Cliente (`client.ts`)

| Aspecto | Comportamiento |
|---|---|
| `baseURL` | `config.apiBaseUrl`: `/api/v1` en desarrollo (proxy de Vite); URL de la API elegida por `VITE_API_TARGET` + `/api/v1` en el build |
| `timeout` | 15 s |
| Request | Añade `Authorization: Bearer` con el token que registra `configureApiAuth` |
| Response (error) | Siempre lanza `ApiRequestError`. Sin respuesta → `network_error` |
| 401 `invalid_token` | Llama a `onUnauthorized` **una sola vez** por token, aunque fallen varias peticiones a la vez. Los demás 401 (`invalid_credentials`) no cierran sesión |
| 429 | `ApiRequestError.retryAfter` con los segundos de la cabecera `Retry-After` |
| Sin lógica de negocio | Ni toasts ni navegación: eso lo decide quien llama |

`configureApiAuth({ getToken, onUnauthorized })` se llama antes del primer render (en `App.tsx`) para desacoplar el cliente del store de sesión.

`cleanParams` quita las claves `undefined` o vacías de los query params.

## Listados

| Función | Devuelve |
|---|---|
| `listEmployees(params, cursor?)` | `Page<Employee>` |
| `listDepartments(params, cursor?)` | `Page<Department>` |
| `listJobTitles(params)` | `JobTitle[]` (sin paginar) |

`cursor` viaja como `after`. Parámetros en `EmployeeListParams`, `DepartmentListParams`, `JobTitleListParams`.

## Reglas

- `getCurrentPosition` traduce `no_active_position` (404) a `null`.
- Las respuestas de error de la API se normalizan en `ApiRequestError.fromBody`; `validation` expone los detalles del 422 listos para formularios.
- Los tipos coinciden con el `/openapi.json` de la API desplegada en Railway (paginación por cursor, `employee_count`, auth).

## Pendiente

- `fetchEmployeeReports` (`GET /employees/{id}/reports`).
- Los hooks de mutación viven en cada feature, no aquí.
