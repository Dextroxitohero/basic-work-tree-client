---
version: 1
slug: "src-components-layout-workspace-tsx"
primary_target: "src/components/layout/Workspace.tsx"
related_targets: ["src/features/auth/LoginPage.tsx"]
---

# Surface brief: workspace Work Tree

Mode: Operate. Surfaces: /login (login + signup) and / (workspace: 4 views, drawers).
Audience: RRHH y administradores, escritorio, tareas repetidas. Task: altas, bajas, jerarquía, puestos con salario.
Standing exit taken by the user: category standard played straight, level of Rippling and Personio. No irony, no smuggled quirk.
Unresolved: org chart, departments, job-titles views still to build; Auth0 deferred (auth is native in the API).

## Direction contract

THESIS: Un SaaS de RRHH ejecutado al nivel de Rippling/Personio: la persona es la unidad, el avatar y su departamento lo identifican de un vistazo. Rechaza el dashboard de tarjetas de métricas.
OWN-WORLD: Fondo blanco azulado frío, sidebar un paso más oscuro, un único acento verde pino; avatares con iniciales teñidos por departamento; Geist con cifras tabulares; bordes de 1px, radios 8px, sombras suaves con desplazamiento.
STORY: La persona de RRHH entra, ve a su gente, filtra, abre una ficha en un drawer y resuelve sin cambiar de página.
FIRST VIEWPORT: Sidebar 240px a la izquierda; a la derecha título Empleados con contador, barra de búsqueda y filtros bajo el título, tabla densa a ancho completo con avatar, nombre y email, departamento, puesto, ingreso y estado. El botón primario «Nuevo empleado» llega con el drawer de alta (aplazado, no omitido). La jerarquía se lee en el drawer (pestaña Reportes) y en la vista Organigrama, pendiente de construir.
FORM: Canon SaaS de administración, user's standing exit, seed key 1f02eb68.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
