# Módulo `users`

Administración de usuarios y permisos. Solo para quien tiene `users:write`.

## Archivos

| Archivo | Contenido |
|---|---|
| `UsersView.tsx` | Vista `?view=users`: búsqueda, filtro de estado, orden, tabla, «cargar más», estados |
| `UserDrawer.tsx` | Drawer `user`: cuenta activa y permisos (checkboxes) |
| `hooks.ts` | `useUserList` (infinite), `useUpdateUser` |
| `../../api/users.ts` | `listUsers`, `updateUser`, `UserListParams`, `UserUpdate` |

## Endpoints

| Método | Ruta | Entrada | Salida | Permiso |
|---|---|---|---|---|
| GET | `/users` | `q` (email o nombre), `is_active`, `sort` (`email`, `created_at`), `order`, `after` | `Page<AuthUser>` | `users:write` |
| PATCH | `/users/{id}` | `{permissions?, is_active?}` (ninguno acepta `null`) | `AuthUser` | `users:write` |

No existe `GET /users/{id}`.

## Comportamiento

- La entrada «Usuarios» del menú solo aparece con `users:write`. Con `?view=users` sin el permiso se muestra una pantalla explicativa; el drawer tampoco se monta.
- **Estado:** `Todos` (defecto, omite `is_active`), `Activos`, `Desactivados`.
- **Drawer:** como no hay `GET /users/{id}`, el usuario se busca en la lista y se cargan páginas hasta encontrarlo (sirve también para enlaces directos).
- **PATCH:** envía solo lo que cambió; los permisos van ordenados. La API ignora duplicados.
- **Tu propia cuenta:** el checkbox `users:write` y el interruptor de cuenta activa están bloqueados.
- Tras editar la propia cuenta se vuelve a pedir `/auth/me`.

## Permisos que se pueden conceder

`employees:read`, `employees:write`, `positions:write`, `job-titles:write`, `departments:write`, `users:write`. Cada uno tiene su texto explicativo en el drawer.

## Errores

| Error | En la UI |
|---|---|
| 409 `last_admin_required` | Aviso «Debe quedar un administrador» (toast propio; el drawer sigue abierto) |
| 404 `user_not_found` | Aviso y se cierra el drawer |
| 422 `validation_error` | Toast |

## Notas

- Un cambio de permisos o de estado es inmediato para el afectado: la API consulta al usuario en cada petición.
- La API ya pone límites: no se puede dejar el sistema sin un administrador activo.
