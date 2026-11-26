# Cambios requeridos en `basic-work-tree-api`

> **Estado: implementado y desplegado** en `https://basic-work-tree-api-production.up.railway.app`. Verificado contra su `/openapi.json` el 26-nov-2026: `/auth/signup|login|me`, `/users` (GET, PATCH con `users:write`), paginación por cursor, `q`, filtros y orden en empleados y departamentos, `employee_count`, y CORS activo. Este documento queda como registro de lo pedido.

Para el cliente `basic-work-tree-client`. Dos bloques: **A. Autenticación propia** y **B. Listados** (paginación, búsqueda, filtros y orden). Actualizar también los `spec.md` de cada módulo y añadir tests.

---

## A. Autenticación propia (signup, login, admin sembrado)

Reemplaza Auth0. Un solo verificador de JWT emitido por la propia API.

| # | Cambio | Detalle |
|---|---|---|
| A1 | Tabla `users` (migración Alembic) | `id` UUID PK; `email` VARCHAR(254) NOT NULL UNIQUE, en minúsculas; `full_name` VARCHAR(120); `password_hash` TEXT NOT NULL; `is_active` BOOL NOT NULL default true; `permissions` TEXT[] NOT NULL default `{employees:read}`; `created_at`, `updated_at` TIMESTAMPTZ |
| A2 | Hash de contraseñas | Argon2id (`argon2-cffi`) o bcrypt. Nunca guardar ni loguear la contraseña. Verificar en tiempo constante aunque el email no exista (evita enumerar usuarios) |
| A3 | `POST /api/v1/auth/signup` | Body `{full_name, email, password}`. `full_name` 1–120, `email` válido, `password` 8–128. Crea el usuario **solo con `employees:read`**; los permisos jamás vienen del body. Respuesta 201 `AuthSession` |
| A4 | `POST /api/v1/auth/login` | Body `{email, password}`. Respuesta 200 `AuthSession` |
| A5 | `GET /api/v1/auth/me` | Requiere token. Devuelve `AuthUser` con permisos **leídos de la base**, no del token |
| A6 | Contratos | `AuthSession = {access_token: string, token_type: "bearer", expires_in: number /* segundos */, user: AuthUser}`. `AuthUser = {id: UUID, email: string, full_name: string \| null, is_active: bool, permissions: string[]}` |
| A7 | Errores (formato `ErrorResponse` actual) | `invalid_credentials` 401 (mismo mensaje para email o contraseña erróneos); `user_email_exists` 409; `account_disabled` 403; `validation_error` 422 como ya existe |
| A8 | JWT | HS256 con el secreto de la app. Claims: `sub` (id del usuario), `email`, `aud`, `iss`, `exp` (12 h), `permissions`. `get_current_user` y `require_permission` siguen igual |
| A9 | Validación contra la base | `get_current_user` carga el usuario y devuelve 401 si no existe o `is_active=false`, aunque el token no haya expirado |
| A10 | Admin sembrado | En `app/seed`: crear si no existe un usuario con **todos** los permisos (`employees:read`, `employees:write`, `positions:write`, `job-titles:write`, `departments:write`). Credenciales desde `ADMIN_EMAIL` y `ADMIN_PASSWORD` |
| A11 | Idempotencia del admin | Se ejecuta en cada arranque (`lifespan`) o en el comando de seed; nunca duplica. Si ya existe, restaura `is_active=true` y todos los permisos, **sin pisar su contraseña** |
| A12 | Config | `ADMIN_EMAIL`, `ADMIN_PASSWORD` (mín. 12 caracteres), `JWT_SECRET` (mín. 32; hoy `LOCAL_JWT_SECRET`). Sin valores por defecto: la app no arranca si faltan. Actualizar `.env.example` |
| A13 | Protección del admin | Ninguna operación puede dejar el sistema sin al menos un admin activo |
| A14 | Fuerza bruta | Rate limit en `/auth/login` y `/auth/signup` (por IP y por email) o bloqueo temporal tras N fallos |
| A15 | Retirar Auth0 | Eliminar `Auth0TokenVerifier`, las variables `AUTH0_*` y `AUTH_MODE`. Un solo verificador |
| A16 | Decisión pendiente | Para subir permisos tras el signup hace falta `GET /users` y `PATCH /users/{id}` (`permissions`, `is_active`) con un permiso nuevo `users:write`. Confirmar si se hace |
| A17 | Tests | Signup crea solo lectura; no se puede elevar permisos por el body; login correcto e incorrecto; email duplicado; usuario inactivo rechazado; el admin existe tras sembrar dos veces; `/auth/me` refleja cambios de permisos |

---

## B. Listados: paginación, búsqueda, filtros y orden

### Paginación por cursor sobre el id (sin `limit` ni `offset`)

```
GET /api/v1/employees?q=ana&department_id=...&sort=last_name&order=asc&after=<cursor>
→ { "items": [...], "next_cursor": "<cursor>" | null }
```

| # | Cambio | Detalle |
|---|---|---|
| B1 | `GET /employees` paginado | Parámetro `after` (cursor opaco). Respuesta `{items, next_cursor}`; `next_cursor` es `null` en la última página. Tamaño de página fijo en el servidor (p. ej. 50) |
| B2 | `GET /departments` paginado | Mismo contrato |
| B3 | Cursor con orden arbitrario | Con `sort` distinto del id, el cursor codifica `(valor_de_orden, id)` y el id desempata. Con UUID v4 no se puede ordenar solo por id; **no hace falta UUID v7** |
| B4 | `q` en `/employees` | Coincidencia parcial, sin distinguir mayúsculas, sobre `first_name`, `last_name` y `email`. Mantener `email` como filtro exacto |
| B5 | `q` en `/departments` y `/job-titles` | Sobre `name` |
| B6 | Filtros nuevos en `/employees` | `department_id`, `manager_id`, `has_manager` (bool; `false` = raíces del organigrama), `job_title_id` (puesto actual) |
| B7 | `is_active` con modo «todos» | En `/employees` y `/job-titles`, omitir el parámetro devuelve activos e inactivos (hoy el default `true` lo impide). El cliente envía `true` o `false` cuando quiere filtrar |
| B8 | Orden en `/employees` | `sort` ∈ `last_name`, `first_name`, `hire_date`, `created_at`; `order` ∈ `asc`, `desc`. Por defecto `last_name asc` |
| B9 | Orden en `/departments` y `/job-titles` | `sort` ∈ `name`, `created_at` (puestos: solo `name`); `order` igual |
| B10 | `/job-titles` | Sigue **sin paginar** (devuelve lista): es un catálogo corto que los selects necesitan completo |
| B11 | `DepartmentDetail` | Quitar `employees`; el cliente usa `GET /employees?department_id=`. El detalle queda igual que `Department` |
| B12 | `employee_count` en `Department` | Entero con los empleados **activos** del departamento, en lista y detalle |
| B13 | Validación | `sort`, `order` o `after` inválidos → 422 `validation_error`. Un cursor mal formado también es 422 |
| B14 | Índices | `(last_name, id)` y `(hire_date, id)` en `employees`; `(created_at, id)` donde se ordene por creación; los necesarios para los filtros |

### Sin cambios
`/employees/{id}/positions`, `/positions/current`, `/reports`, `/tree` y todos los POST, PATCH y DELETE.

---

## C. Transversal

| # | Cambio | Detalle |
|---|---|---|
| C1 | CORS | Añadir `CORSMiddleware` con `allow_origins` desde configuración, `allow_headers=["Authorization","Content-Type"]` y los métodos usados. El token va en `Authorization`, así que no hace falta `allow_credentials` |
| C2 | Specs | Actualizar `auth/spec.md`, `employees/spec.md`, `departments/spec.md`, `job_titles/spec.md` y `core/spec.md` (contrato de paginación) |
| C3 | Tests | Cursor, orden, filtros y búsqueda en cada listado |
