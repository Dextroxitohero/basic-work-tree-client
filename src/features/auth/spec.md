# Módulo `auth`

Quién eres y qué puedes hacer. El cliente no guarda contraseñas: la API valida credenciales y emite un JWT. Toda la lógica de permisos de la UI vive aquí; la autorización real siempre la hace la API.

Endpoints verificados en la API de Railway (`/auth/signup`, `/auth/login`, `/auth/me`). Probado a través del proxy de Vite: un login con credenciales falsas devuelve 401 `invalid_credentials`, que es el código que maneja el formulario.

## Archivos

| Archivo | Contenido |
|---|---|
| `LoginPage.tsx` | Pantalla `/login`: pestañas «Iniciar sesión» y «Registrarme», formulario, panel ilustrado |
| `OrgArt.tsx` | `OrgMark` (marca) y `OrgTreeArt` (ilustración con datos sintéticos) |
| `../../components/PasswordInput.tsx` | Campo de contraseña con botón para mostrarla u ocultarla (`aria-pressed`, accesible con teclado). Empieza oculta y se reinicia al cambiar entre acceso y registro |
| `store.ts` | `useAuthStore`, `useCan`, tipo `Permission` |
| `ProtectedRoute.tsx` | Redirige a `/login` si no hay token |
| `../../api/auth.ts` | `login`, `signup`, `fetchMe` |

## Endpoints

| Método | Ruta | Entrada | Salida |
|---|---|---|---|
| POST | `/auth/signup` | `{full_name, email, password}` | 201 `AuthSession` |
| POST | `/auth/login` | `{email, password}` | `AuthSession` |
| GET | `/auth/me` | — | `AuthUser` |

`AuthSession = {access_token, token_type, expires_in, user}`. `AuthUser = {id, email, full_name, is_active, permissions}`.

## Flujo

1. `LoginPage` envía login o signup. Con éxito, `setSession` guarda token, usuario y `expiresAt`, y se redirige a `/`.
2. `configureApiAuth` (en `App.tsx`) lee el token del store en cada petición.
3. `Workspace` consulta `/auth/me` (`staleTime` 60 s) y actualiza `user`, así un cambio de permisos se refleja sin volver a entrar.
4. Un 401 cierra la sesión y limpia la caché de Query.

## Store de sesión

| Campo | Significado |
|---|---|
| `token` | JWT |
| `user` | `AuthUser`; los permisos salen de aquí, **no** del token |
| `expiresAt` | Epoch ms calculado con `expires_in` |

Persistencia en `sessionStorage` (no sobrevive al cerrar la pestaña). Al hidratar, una sesión expirada se descarta antes de que salga ninguna petición.

## Validaciones del formulario

| Campo | Regla |
|---|---|
| `full_name` (signup) | 1–120 |
| `email` | Obligatorio, formato válido |
| `password` | Login: obligatoria. Signup: 8–128 |

## Errores

| Error | Tratamiento |
|---|---|
| `invalid_credentials` (401) | Mensaje en el formulario: «Email o contraseña incorrectos». **No cierra sesión** |
| `invalid_token` (401) | Único error que cierra la sesión: limpia la caché y vuelve a `/login` |
| `user_email_exists` (409) | Error en el campo `email` |
| `account_disabled` (403) | Mensaje en el formulario |
| `too_many_requests` (429) | Mensaje de la API y botón deshabilitado con cuenta atrás desde `Retry-After` («Reintenta en 3 s»); se rehabilita solo |
| `validation_error` (422) | Se mapea a los campos por `loc` |
| Otros | Toast global |

El interceptor distingue por `error`, no solo por el código HTTP. Si varias peticiones fallan a la vez con el mismo token caducado, el cierre ocurre una sola vez; un token nuevo vuelve a poder cerrarse.

## Límites de intentos (API)

| Endpoint | Límite |
|---|---|
| Login | 5 contraseñas incorrectas por email en 15 min (después ese email queda bloqueado, incluso con la contraseña correcta); 30 intentos por minuto por IP |
| Signup | 10 por hora por IP y 3 por hora por email |

Un login correcto reinicia el contador de fallos de ese email.

## Permisos → UI

`useCan('employees:write')` devuelve si el usuario lo tiene. Sin `employees:read`, el workspace muestra «Tu cuenta no tiene acceso a los datos». Los botones de acción se ocultan por permiso.

| Permiso | Habilita |
|---|---|
| `employees:read` | Ver todo, incluidos salarios |
| `employees:write` | Alta, edición y baja de empleados |
| `positions:write` | Asignar puesto |
| `job-titles:write` | Catálogo de puestos |
| `departments:write` | Departamentos |
| `users:write` | Gestión de usuarios (módulo `users`) |

## Reglas

- Signup crea cuentas de solo lectura. El cliente nunca envía permisos.
- Mismo mensaje para email o contraseña erróneos (no revela qué cuentas existen).
- El admin sembrado existe siempre en la API; el cliente no tiene ningún flujo especial para él.

## Pendiente

- `<Can>` (componente envoltorio); hoy solo existe el hook `useCan`.
- La API no tiene cambio ni recuperación de contraseña, ni refresh token, ni logout en el servidor: cerrar sesión es descartar el token.
- Los salarios los ve cualquier usuario registrado (`employees:read`); ocultarlos en la UI es solo comodidad, no protección (decisión pendiente en la API).
- Cierre de sesión por expiración mientras la pestaña sigue abierta (hoy solo al hidratar y ante un 401).
