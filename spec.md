# Basic Work Tree Client

Frontend de la **Employee Work Tree API** (`../basic-work-tree-api`): empleados, organigrama, departamentos, catálogo de puestos e historial de puestos con salario.

Este documento es el contrato transversal del cliente. El detalle de cada módulo está en su propio `spec.md`; la fuente de verdad del backend son los `spec.md` de la API y `BACKEND-CHANGES.md` (cambios que el cliente ya asume).

Contexto de producto y diseño: `PRODUCT.md` (usuarios, propósito, principios) y `.impeccable/surfaces/` (dirección visual). `DESIGN.md` aún no existe.

## Módulos

| Módulo | Carpeta | Responsabilidad | Estado |
|---|---|---|---|
| `api` | `src/api/` | Cliente HTTP, tipos, errores, query keys, funciones de red | Hecho |
| `today` | `src/features/today/` | Vista «Hoy»: resumen con datos reales y pendientes | Hecho |
| `auth` | `src/features/auth/` | Signup, login, sesión, permisos | Hecho; endpoints verificados en Railway |
| `employees` | `src/features/employees/` | Tabla, ficha, alta, edición, baja, reactivar, asignar puesto | Hecho |
| `departments` | `src/features/departments/` | Vista, ficha y formulario de departamentos | Hecho |
| `users` | `src/features/users/` | Gestión de usuarios y permisos (admin) | Hecho |
| `job-titles` | `src/features/job-titles/` | Catálogo de puestos | Hecho |
| `org-chart` | `src/features/org-chart/` | Organigrama | Hecho |
| `drawers` | `src/drawers/` | `DrawerHost`, `useDrawer` y estado de drawers en la URL | Hecho |
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
| Bandera | `VITE_API_TARGET` = `local` \| `production` (por defecto `production`) elige la API |
| Base URL | Desarrollo: `/api/v1` (relativa). Build: URL elegida + `/api/v1` |
| Desarrollo | Proxy de Vite: `/api` → la URL de la API elegida (sin CORS) |
| API desplegada | `https://basic-work-tree-api-production.up.railway.app` (Railway) |
| CORS en Railway | Activo, pero **rechaza `http://localhost:5173`** (preflight 400); por eso en desarrollo se usa el proxy de Vite |
| Producción del front | Su origen debe estar en `CORS_ORIGINS` de la API elegida |
| Formato | JSON; IDs `UUID`; fechas `YYYY-MM-DD`; timestamps ISO 8601 |
| Auth | `Authorization: Bearer <jwt>` en todas las peticiones salvo login y signup |
| Healthcheck | `GET /health` (fuera de `/api/v1`) |

```env
# .env (versionado, sin secretos)
VITE_API_TARGET=production          # bandera: local | production
VITE_API_URL_LOCAL=http://localhost:8000
VITE_API_URL_PRODUCTION=https://basic-work-tree-api-production.up.railway.app
```

Por defecto el cliente habla con **Railway**. Para tu máquina, `.env.local` (no se versiona) con `VITE_API_TARGET=local`. Una variable del sistema o de Railway tiene prioridad sobre los `.env`. El front desplegado en Railway no necesita variables: el build usa `.env`. Un build sin la URL de la API elegida falla al compilar, en vez de desplegar un cliente que llamaría a su propio dominio. El menú de perfil muestra a qué API apunta la sesión.

## Autenticación (resumen)

Auth **propia en la API** (sin Auth0): `POST /auth/signup`, `POST /auth/login`, `GET /auth/me`. Siempre existe un administrador sembrado con todos los permisos (sus credenciales las define el despliegue, no el cliente). Quien se registra recibe solo `employees:read`. Detalle en `src/features/auth/spec.md`.

| Permiso | Habilita en la UI |
|---|---|
| `employees:read` | Ver todo. **Incluye salarios de todos** |
| `employees:write` | Crear, editar y dar de baja/reactivar empleados |
| `positions:write` | Asignar puesto |
| `job-titles:write` | Crear/editar catálogo de puestos |
| `departments:write` | Crear/editar departamentos |
| `users:write` | Pantalla de usuarios: cambiar permisos y activar o desactivar cuentas |

La UI oculta acciones según permisos (`useCan`); la autorización real la hace siempre la API.

## Contrato de la API

Todo bajo `/api/v1`. Contrato verificado contra el `/openapi.json` de Railway (26-nov-2026). Los listados paginados devuelven `{ items, next_cursor }`.

| Método | Ruta | Entrada | Salida | Permiso |
|---|---|---|---|---|
| POST | `/auth/signup` | `SignupBody` | 201 `AuthSession` | público |
| POST | `/auth/login` | `LoginBody` | `AuthSession` | público |
| GET | `/auth/me` | — | `AuthUser` | token |
| GET | `/users` | `q`, `is_active`, `sort` (`email`, `created_at`), `order`, `after` | `Page<AuthUser>` | `users:write` |
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
| 401 | `invalid_token` | `logout()` y volver a `/login` (único 401 que cierra sesión) |
| 403 | `insufficient_permissions` | Toast; no cerrar sesión |
| 403 | `account_disabled` | Mensaje en el formulario de login |
| 409 | `last_admin_required` | Aviso: debe quedar un administrador activo |
| 429 | `too_many_requests` | Botón deshabilitado con cuenta atrás desde `Retry-After` |
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
| `today` (defecto) | Resumen, pulso de departamentos y pendientes | `today` |
| `employees` | Tabla con búsqueda, filtros, orden y «cargar más» | `employees` |
| `org-chart` | Árbol de la jerarquía | `org-chart` |
| `departments` | Lista de departamentos | `departments` |
| `job-titles` | Catálogo de puestos | `job-titles` |

Vista, filtros, búsqueda, orden, drawer abierto y pestaña viven en la **URL**, no en Zustand.

### Estados obligatorios
Cada tabla y drawer tiene carga (skeleton), vacío (con CTA si hay permiso), error (con «reintentar») y sin permiso.

### Diseño
Dirección: basada en una referencia aportada por el usuario (panel con marco degradado índigo, app flotante de esquinas redondeadas, tarjetas blancas, píldoras de estado, campana de pendientes). Se tomó el lenguaje visual; no la marca ni sus indicadores. Tokens en `src/index.css`: superficie lavanda, índigo profundo, violeta para contadores, tonos `ok`/`warn`/`risk`, Geist con cifras tabulares, radio base 12 px, sombras suaves. Detalle en `.impeccable/surfaces/`.

## Estructura del proyecto

```
src/
├── main.tsx, App.tsx          # providers, rutas y sesión
├── config.ts                  # lectura de import.meta.env
├── api/                       # cliente, tipos, errores, keys, funciones de red
├── features/
│   ├── auth/  today/  employees/  departments/  job-titles/  org-chart/  users/
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
| Tests | Vitest + Testing Library (pendiente). Los flujos de crear y editar se probaron con un script de Playwright contra una API simulada, fuera del repo |
| Mock de API | MSW con los códigos de error de la API (pendiente) |
| E2E | Playwright (pendiente) |

Accesibilidad: labels en formularios, errores con `role="alert"` y `aria-describedby`, foco visible, filas de tabla accionables con teclado, `Sheet` de Base UI con sus atributos ARIA, contraste AA.

## Fases

| # | Fase | Estado |
|---|---|---|
| 1 | Base: Vite, Tailwind, shadcn, proxy, cliente, Query, Toaster | Hecha |
| 2 | Auth: login, signup, sesión, permisos | Hecha; conectada a Railway |
| 3 | Empleados: lista y ficha | Hecha |
| 4 | Empleados: alta, edición, baja/reactivar | Hecha |
| 5 | Asignar puesto | Hecha |
| 6 | Departamentos y puestos (vistas y formularios) | Hecha |
| 7 | Organigrama | Hecha |
| 8 | Gestión de usuarios (vista admin con `users:write`) | Hecha |
| 9 | Vista «Hoy» y rediseño sobre la referencia aportada | Hecha |
| 10 | Pulido: tests, `DESIGN.md`, revisión de diseño independiente | Pendiente |

## Decisiones abiertas

| Tema | Pregunta |
|---|---|
| CORS del front desplegado | Falta añadir el origen donde se publique el front al CORS de la API |
| Total de resultados | ¿Se devuelve `total` en la primera página o solo `next_cursor`? |
| Divisa del salario | La API no la define; hoy se muestra el número sin símbolo |
| Tema oscuro | Tokens definidos, sin interruptor ni verificación visual |
| Salarios | La API los entrega a cualquier usuario registrado (`employees:read`); ocultarlos en la UI no protege nada |
| Contraseñas | La API no tiene cambio ni recuperación de contraseña |
| Tipos | Conviene generarlos desde `/openapi.json` (por ejemplo con `openapi-typescript`); hoy están escritos a mano y verificados contra él |
