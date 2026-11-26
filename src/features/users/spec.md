# Módulo `users`

Gestión de usuarios y permisos para administradores. **Pendiente de construir**; la API ya expone los endpoints.

## Archivos previstos

| Archivo | Contenido |
|---|---|
| `UsersView.tsx` | Vista `?view=users`, visible solo con `users:write`: búsqueda, filtro activos/inactivos, lista |
| `UserDrawer.tsx` | Drawer `user`: datos y edición de permisos y estado |
| `hooks.ts` | `useUserList` (infinite query), `useUpdateUser` |
| `../../api/users.ts` | `listUsers`, `updateUser` |

## Endpoints (verificados en Railway)

| Método | Ruta | Entrada | Salida | Permiso |
|---|---|---|---|---|
| GET | `/users` | `q`, `is_active`, `sort` (`email`, `created_at`), `order`, `after` | `Page<AuthUser>` | `users:write` |
| PATCH | `/users/{id}` | `{permissions?, is_active?}` | `AuthUser` | `users:write` |

`permissions` acepta: `employees:read`, `employees:write`, `positions:write`, `job-titles:write`, `departments:write`, `users:write`.

## Reglas

- Quien se registra empieza con solo `employees:read`; un administrador amplía permisos aquí.
- La entrada «Usuarios» del sidebar solo aparece con `users:write`.
- El cliente no debe permitir que un administrador se quite a sí mismo `users:write` ni se desactive; la API además protege que siempre quede un admin activo.
- Un cambio de permisos se refleja en el afectado en su siguiente consulta a `/auth/me` (60 s de caché en el shell).
- Invalidación: `users.all` tras editar (key pendiente en `api/keys.ts`).
