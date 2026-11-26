# Basic Work Tree Client

Frontend de la **Employee Work Tree API** (`../basic-work-tree-api`): empleados, organigrama, departamentos, catálogo de puestos e historial de puestos con salario.

Este documento es el contrato transversal del cliente. El detalle de cada módulo está en su propio `spec.md`; la fuente de verdad del backend son los `spec.md` de la API y `BACKEND-CHANGES.md` (cambios que el cliente ya asume).

Contexto de producto y diseño: `PRODUCT.md` (usuarios, propósito, principios) y `.impeccable/surfaces/` (dirección visual). `DESIGN.md` aún no existe.

## Módulos

| Módulo | Carpeta | Responsabilidad | Estado |
|---|---|---|---|
| `api` | `src/api/` | Cliente HTTP, tipos, errores, query keys, funciones de red | Hecho |
| `auth` | `src/features/auth/` | Signup, login, sesión, permisos | Hecho; endpoints verificados en Railway |
| `employees` | `src/features/employees/` | Tabla de empleados y drawer de ficha | Lista y ficha (solo lectura) hechas; formularios pendientes |
| `departments` | `src/features/departments/` | Departamentos | Solo hook de lectura; vista y formularios pendientes |
| `users` | `src/features/users/` | Gestión de usuarios y permisos (admin) | Pendiente; la API ya expone `/users` |
| `job-titles` | `src/features/job-titles/` | Catálogo de puestos | Pendiente |
| `org-chart` | `src/features/org-chart/` | Organigrama | Pendiente |
| `drawers` | `src/drawers/` | `DrawerHost` y estado de drawers en la URL | Hecho para `employee` |
| `layout` | `src/components/layout/` | Workspace: sidebar, vistas, shell responsive | Hecho |
| `lib` | `src/lib/`, `src/stores/`, `src/hooks/` | Notificaciones, formato, color, query client, stores de UI | Hecho |

## Stack

| Capa | Tecnología | Uso |
|---|---|---|
| Build | Vite 8 + React 19 | SPA |
| Lenguaje | TypeScript (`strict`) | Sin `any`; tipos de la API en `src/api/types.ts` |
| Estado de cliente | Zustand | Sesión y preferencias de UI; nada que venga del servidor |
| Estado de servidor | TanStack Query | Caché, invalidación y reintentos de todo lo de la API |
| HTTP | Axios | Una instancia con interceptores |
| UI | shadcn/ui (`base-nova`, Base UI) + Tailwind CSS v4 | Componentes en `src/components/ui` |
| Notificaciones | Sileo | Feedback de éxito, error y promesas |
| Rutas | `react-router` | Solo `/login` y `/` |
| Formularios | `react-hook-form` + `zod` + `@hookform/resolvers` | Mismas reglas que valida la API |
| Fechas | `date-fns` (locale `es`) | Formato |
| Lint | oxlint | Del scaffold de Vite |

**Regla de oro del estado:** lo que viene de la API vive en TanStack Query, nunca se copia a Zustand.

## Conexión con la API

| Aspecto | Valor |
|---|---|
| Base URL | `VITE_API_URL` + `/api/v1`. Vacío en desarrollo |
| Desarrollo | Proxy de Vite: `/api` → `API_PROXY_TARGET` (sin CORS) |
| API desplegada | `https://basic-work-tree-api-production.up.railway.app` (Railway) |
| CORS en Railway | Activo, pero **rechaza `http://localhost:5173`** (preflight 400); por eso en desarrollo se usa el proxy de Vite |
| Producción del front | Su origen debe añadirse al CORS de la API; entonces `VITE_API_URL` apunta a la API |
| Formato | JSON; IDs `UUID`; fechas `YYYY-MM-DD`; timestamps ISO 8601 |
| Auth | `Authorization: Bearer <jwt>` en todas las peticiones salvo login y signup |
| Healthcheck | `GET /health` (fuera de `/api/v1`) |

```env
VITE_API_URL=                          # vacío en dev
API_PROXY_TARGET=https://basic-work-tree-api-production.up.railway.app   # solo dev
```

Por defecto el cliente habla con **Railway** a través del proxy de Vite. Para una API local: `API_PROXY_TARGET=http://localhost:8000` en `.env.local` (no se versiona).

## Autenticación (resumen)

Auth **propia en la API** (sin Auth0): `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`. Siempre existe un administrador sembrado con todos los permisos (sus credenciales las define el despliegue, no el cliente). Quien se registra recibe solo `employees:read`. Detalle en `src/features/auth/spec.md`.

| Permiso | Habilita en la UI |
|---|---|
| `employees:read` | Ver todo. **Incluye salarios de todos** |
| `employees:write` | Crear, editar y dar de baja/reactivar empleados |
| `positions:write` | Asignar puesto |
| `job-titles:write` | Crear/editar catálogo de puestos |
| `departments:write` | Crear/editar departamentos |
| `users:write` | Ver usuarios y cambiar sus permisos o activarlos/desactivarlos |

La UI oculta acciones según permisos (`useCan`); la autorización real la hace siempre la API.

## Contrato de la API

Todo bajo `/api/v1`. Contrato verificado contra el `/openapi.json` de Railway (26-nov-2026). Los listados paginados devuelven `{ items, next_cursor }`.

| Método | Ruta | Entrada | Salida | Permiso |
|---|---|---|---|---|
| POST | `/auth/signup` | `SignupBody` | 201 `AuthSession` | público |
| POST | `/auth/login` | `LoginBody` | `AuthSession` | público |
| GET | `/auth/me` | — | `AuthUser` | token |
| GET | `/users` | `q`, `is_active`, `sort`, `order`, `after` | `Page<AuthUser>` | `users:write` |
| PATCH | `/users/{id}` | `{permissions?, is_active?}` | `AuthUser` | `users:write` |
| GET | `/employees` | `q`, `is_active`, `department_id`, `manager_id`, `has_manager`, `job_title_id`, `sort`, `order`, `after` | `Page<Employee>` | `employees:read` |
| POST | `/employees` | `EmployeeCreate` | 201 `Employee` | `employees:write` |
| GET | `/employees/{id}` | — | `EmployeeDetail` | `employees:read` |
| PATCH | `/employees/{id}` | `EmployeeUpdate` | `Employee` | `employees:write` |
| DELETE | `/employees/{id}` | — | 204 | `employees:write` |
| GET | `/employees/{id}/reports` | — | `Employee[]` | `employees:read` |
| GET | `/employees/{id}/tree` | — | `EmployeeTreeNode` | `employees:read` |
| GET | `/employees/{id}/positions` | — | `PositionHistory[]` | `employees:read` |
| GET | `/employees/{id}/positions/current` | — | `PositionHistory` | `employees:read` |
| POST | `/employees/{id}/positions` | `PositionCreate` | 201 `PositionHistory` | `positions:write` |
| GET | `/departments` | `q`, `sort`, `order`, `after` | `Page<Department>` | `employees:read` |
| POST | `/departments` | `DepartmentCreate` | 201 `Department` | `departments:write` |
| GET | `/departments/{id}` | — | `Department` | `employees:read` |
| PATCH | `/departments/{id}` | `DepartmentUpdate` | `Department` | `departments:write` |
| GET | `/job-titles` | `q`, `is_active`, `sort`, `order` | `JobTitle[]` | `employees:read` |
| POST | `/job-titles` | `JobTitleCreate` | 201 `JobTitle` | `job-titles:write` |
| GET | `/job-titles/{id}` | — | `JobTitle` | `employees:read` |
| PATCH | `/job-titles/{id}` | `JobTitleUpdate` | `JobTitle` | `job-titles:write` |

Tipos completos en `src/api/types.ts` y `src/api/auth.ts`.

### Reglas del contrato que el cliente respeta

- **PATCH con tres estados:** omitir = no tocar; `null` = borrar; valor = cambiar. Los formularios de edición envían solo los campos modificados. `first_name`, `last_name`, `is_active`, y `name` (departamento y puesto) no aceptan `null`.
- **Cuerpos estrictos:** un campo desconocido da 422 (por ejemplo `email` en el PATCH de empleado).
- **Salario:** `string`, nunca `number`; > 0, ≤ 2 decimales, ≤ 12 dígitos. Solo se formatea para mostrar.
- **`is_active`:** omitirlo devuelve activos e inactivos; el cliente lo envía explícito cuando filtra.
- **Baja de empleado:** `DELETE` o `PATCH {is_active:false}`; idempotente.

### Validaciones (espejo en zod)

| Campo | Regla |
|---|---|
| `full_name` (signup) | 1–120, `trim` |
| `email` | Válido; en alta solamente |
| `password` | 8–128 |
| `first_name`, `last_name` | 1–80, `trim` |
| `phone` | 1–20, opcional |
| `hire_date`, `start_date` | No futuras |
| Departamento `name` | 1–100, `trim` |
| Puesto `name` / `description` | 1–120 / ≤ 1000 |
| `salary` | Decimal > 0, ≤ 2 decimales, ≤ 12 dígitos |
| `notes` | ≤ 500 |

## Manejo de errores

Todas las respuestas de error son `ApiError { error, message, details? }`. El cliente decide por `error` y muestra `message` (en español).

| HTTP | `error` | Tratamiento |
|---|---|---|
| 401 | `invalid_credentials` | Mensaje en el formulario de login |
| 401 | `invalid_token` | `logout()` y volver a `/login` |
| 403 | `insufficient_permissions` | Toast; no cerrar sesión |
| 403 | `account_disabled` | Mensaje en el formulario de login |
| 404 | `employee_not_found`, `department_not_found`, `job_title_not_found` | Estado de error en el drawer o vista |
| 404 | `no_active_position` | No es un error: significa «sin puesto actual» (`null`) |
| 409 | `user_email_exists`, `email_already_exists` | Error en el campo `email` |
| 409 | `department_name_exists`, `job_title_name_exists` | Error en el campo `name` |
| 409 | `inactive_manager` | Error en el campo jefe/encargado |
| 409 | `circular_manager_reference` | Error en jefe: «crearía un ciclo en la jerarquía» |
| 409 | `overlapping_position` | Error en `start_date` |
| 409 | `employee_inactive`, `job_title_inactive` | Toast |
| 422 | `validation_error` | `loc` → campo del formulario (`setError`) |
| 5xx / red | `internal_error`, `network_error` | Toast global |

`ApiRequestError { status, code, message, details }` normaliza todo (`src/api/errors.ts`); sin respuesta → `network_error`.

## Notificaciones (Sileo)

`<Toaster />` montado una vez en `App`; todo pasa por `src/lib/notify.ts`.

| Evento | Notificación |
|---|---|
| Mutación correcta | Toast de éxito en `onSuccess` |
| Error de campo (409/422 mapeable) | En el formulario; sin toast duplicado |
| Error sin campo | Toast con `message` |
| Error transversal (403, 5xx, red) | Un toast desde el `onError` global de Query |

## TanStack Query

- Cliente en `src/lib/query-client.ts`: `staleTime` 30 s, sin refetch al enfocar, reintento solo en 5xx (máx. 2). `onError` global omite 401/409/422.
- Keys en `src/api/keys.ts`. Listas paginadas con `useInfiniteQuery` (`getNextPageParam: p => p.next_cursor`).
- Sin actualizaciones optimistas: las reglas (ciclos, activos, fechas) las decide el servidor.

| Mutación | Invalidar |
|---|---|
| Crear/editar empleado | `employees.all` |
| Baja de empleado | `employees.all` y `departments.all` (deja sin encargado/jefe) |
| Asignar puesto | `employees.all` |
| Crear/editar departamento | `departments.all`; si cambia `manager_id`, también `employees.all` |
| Crear/editar puesto | `jobTitles.all` |
| Cerrar sesión | `queryClient.clear()` |

## Interfaz: workspace con drawers

Dos rutas: `/login` (login y registro) y `/` (workspace). Todo lo demás se abre en drawers laterales (`Sheet`). Detalle en `src/components/layout/spec.md` y `src/drawers/spec.md`.

| `?view=` | Vista | Módulo |
|---|---|---|
| `employees` (defecto) | Tabla con búsqueda, filtros, orden y «cargar más» | `employees` |
| `org-chart` | Árbol de la jerarquía | `org-chart` |
| `departments` | Lista de departamentos | `departments` |
| `job-titles` | Catálogo de puestos | `job-titles` |

Vista, filtros, búsqueda, orden, drawer abierto y pestaña viven en la **URL**, no en Zustand.

### Estados obligatorios
Cada tabla y drawer tiene carga (skeleton), vacío (con CTA si hay permiso), error (con «reintentar») y sin permiso.

### Diseño
Dirección: SaaS de administración estándar, al nivel de Rippling/Personio (salida estándar elegida por el usuario). Tokens en `src/index.css`: base azulada fría, acento verde pino, Geist con cifras tabulares, radios 8 px, sombras suaves. Detalle en `.impeccable/surfaces/`.

## Estructura del proyecto

```
src/
├── main.tsx, App.tsx          # providers, rutas y sesión
├── config.ts                  # lectura de import.meta.env
├── api/                       # cliente, tipos, errores, keys, funciones de red
├── features/
│   ├── auth/  employees/  departments/  job-titles/  org-chart/  users/
├── drawers/                   # DrawerHost
├── components/
│   ├── ui/                    # shadcn + EmployeeAvatar
│   └── layout/                # Workspace, views
├── hooks/                     # useUrlState
├── stores/                    # ui.ts
└── lib/                       # notify, format, dept-color, query-client, utils
```

Convención: `api/*.ts` son funciones de red sin React; los hooks de Query viven en su `feature`. Una feature no importa de otra salvo vía `api/`, `components/` y `lib/`.

## Calidad

| Área | Herramienta |
|---|---|
| Lint | `npm run lint` (oxlint) |
| Tipos | `tsc -b` (incluido en `npm run build`) |
| Tests | Vitest + Testing Library (pendiente) |
| Mock de API | MSW con los códigos de error de la API (pendiente) |
| E2E | Playwright (pendiente) |

Accesibilidad: labels en formularios, errores con `role="alert"` y `aria-describedby`, foco visible, filas de tabla accionables con teclado, `Sheet` de Base UI con sus atributos ARIA, contraste AA.

## Fases

| # | Fase | Estado |
|---|---|---|
| 1 | Base: Vite, Tailwind, shadcn, proxy, cliente, Query, Toaster | Hecha |
| 2 | Auth: login, signup, sesión, permisos | Hecha; conectada a Railway |
| 3 | Empleados: lista y ficha (lectura) | Hecha |
| 4 | Empleados: alta, edición, baja/reactivar | Pendiente |
| 5 | Asignar puesto | Pendiente |
| 6 | Departamentos y puestos (vistas y formularios) | Pendiente |
| 7 | Organigrama | Pendiente |
| 8 | Gestión de usuarios (vista admin con `users:write`) | Pendiente |
| 9 | Pulido: tests, E2E, `DESIGN.md`, arreglos del revisor de diseño | Pendiente |

## Decisiones abiertas

| Tema | Pregunta |
|---|---|
| CORS del front desplegado | Falta añadir el origen donde se publique el front al CORS de la API |
| Total de resultados | ¿Se devuelve `total` en la primera página o solo `next_cursor`? |
| Divisa del salario | La API no la define; hoy se muestra el número sin símbolo |
| Tema oscuro | Tokens definidos, sin interruptor ni verificación visual |
