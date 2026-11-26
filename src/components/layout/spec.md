# Módulo `layout`

El workspace: marco degradado, sidebar, barra superior, navegación entre vistas y contenedor de drawers. Es la única pantalla autenticada.

## Archivos

| Archivo | Contenido |
|---|---|
| `Workspace.tsx` | Shell: marco, sidebar, `TopBar` (búsqueda global), cabecera móvil, vista activa, `DrawerHost`, refresco de `/auth/me` |
| `HeaderActions.tsx` | Campana con pendientes y menú de perfil (cerrar sesión) |
| `useGoToView.ts` | Cambiar de vista descartando filtros y drawer |
| `views.ts` | `VIEWS` y el tipo `View` |

## Estructura

| Ancho | Layout |
|---|---|
| ≥ md | La app flota como tarjeta de esquinas muy redondeadas sobre un fondo degradado índigo (el degradado está en `body`). Sidebar de 240 px sin fondo propio, barra superior y contenido |
| < md | Sin marco: la app ocupa toda la pantalla. Cabecera fija con marca, campana y perfil; barra horizontal de vistas con desvanecido de borde |

## Vistas

| `?view=` | Vista | Estado |
|---|---|---|
| `today` (defecto) | `TodayView` | Hecho |
| `employees` | `EmployeesView` | Hecho |
| `org-chart` | `OrgChartView` | Hecho |
| `departments` | `DepartmentsView` | Hecho |
| `job-titles` | `JobTitlesView` | Hecho |

Cambiar de vista descarta filtros y drawer de la anterior (`q`, `status`, `dept`, `sort`, `drawer`, `id`, `tab`).

## Sesión en el shell

- Nombre, email, número de permisos y «Cerrar sesión» están en el menú de perfil de la barra superior.
- Consulta `/auth/me` y actualiza el usuario del store, para que los permisos estén al día.
- Sin `employees:read` muestra «Tu cuenta no tiene acceso a los datos» en lugar de la vista.

## Barra superior

- **Búsqueda global** (Ctrl/⌘ + K para enfocar): al enviar lleva a Empleados con `q` aplicado; la URL es la fuente de verdad del texto de esa tabla.
- **Campana:** muestra los mismos pendientes que «Hoy» (`useAttention`), con contador violeta. Cada uno trae su acción.
- **Menú de sidebar:** «Hoy» lleva el contador de pendientes.

## Diseño

- Superficie lavanda fría, tarjetas blancas, índigo profundo como acento (`--primary`) y violeta solo para contadores (`--violet`). Estados con tonos `ok`, `warn`, `risk` (`StatusPill`).
- La vista activa es una píldora blanca con sombra e icono en acento; `aria-current="page"`.
- Tokens, selección de texto, scrollbar, foco y cifras tabulares (`.num`) están en `src/index.css`.
- Sin kickers ni tarjetas de métricas: título, contador y herramientas encima de la tabla.

## Pendiente

Desvanecido de la barra móvil poco perceptible según el revisor de diseño; interruptor de tema oscuro.
