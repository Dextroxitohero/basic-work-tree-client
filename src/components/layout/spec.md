# Módulo `layout`

El workspace: sidebar, navegación entre vistas y contenedor de drawers. Es la única pantalla autenticada.

## Archivos

| Archivo | Contenido |
|---|---|
| `Workspace.tsx` | Shell: sidebar (escritorio), cabecera con nav (móvil), vista activa, `DrawerHost`, refresco de `/auth/me` |
| `views.ts` | `VIEWS` y el tipo `View` |

## Estructura

| Ancho | Layout |
|---|---|
| ≥ md | Sidebar fijo de 240 px a la izquierda; contenido a la derecha con padding de 32 px |
| < md | Cabecera fija con marca y botón de salir; barra horizontal de vistas con desvanecido de borde; padding de 16 px |

## Vistas

| `?view=` | Vista | Estado |
|---|---|---|
| `employees` (defecto) | `EmployeesView` | Hecho |
| `org-chart`, `departments`, `job-titles` | Estado «en construcción» | Pendiente |

Cambiar de vista descarta filtros y drawer de la anterior (`q`, `status`, `dept`, `sort`, `drawer`, `id`, `tab`).

## Sesión en el shell

- Muestra nombre o email del usuario y «Cerrar sesión».
- Consulta `/auth/me` y actualiza el usuario del store, para que los permisos estén al día.
- Sin `employees:read` muestra «Tu cuenta no tiene acceso a los datos» en lugar de la vista.

## Diseño

- Fondo azulado frío, sidebar un paso más oscuro, un único acento verde pino (`--primary`).
- La vista activa lleva fondo `sidebar-accent` e icono en acento; `aria-current="page"`.
- Tokens, selección de texto, scrollbar, foco y cifras tabulares (`.num`) están en `src/index.css`.
- Sin kickers ni tarjetas de métricas: título, contador y herramientas encima de la tabla.

## Pendiente

Desvanecido de la barra móvil poco perceptible según el revisor de diseño; interruptor de tema oscuro.
