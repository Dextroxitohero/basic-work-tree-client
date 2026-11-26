# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personal de RRHH y administradores que gestionan empleados a diario, desde escritorio. Altas, bajas, cambios de jefe y departamento, asignación de puestos con salario. Consultan y reorganizan la jerarquía. Pocas personas, uso frecuente, tareas repetidas.

## Product Purpose

Work Tree es el cliente web de la Employee Work Tree API (`../basic-work-tree-api`). Permite mantener empleados, organigrama, departamentos, catálogo de puestos e historial de puestos con salario y fechas. Éxito: completar una alta, una baja o un cambio de puesto en segundos, sin errores de jerarquía (ciclos, jefes inactivos, solapes de fechas).

## Positioning

El organigrama y la ficha del empleado se editan en el mismo lugar: la jerarquía es la entrada principal, no una tabla con un gráfico aparte. Todo el trabajo ocurre en un workspace con drawers laterales, sin saltar entre páginas.

## Operating Context

- Interfaz en español.
- Un workspace en `/` con 4 vistas (`?view=`) y drawers en la URL (`?drawer=`); solo `/login` y `/` como rutas.
- Datos de la API: listas paginadas por cursor, búsqueda `q`, filtros y orden en servidor.
- Los salarios son sensibles: visibles con `employees:read`, con opción de ocultarlos en pantalla.
- Permisos por acción (`employees:write`, `positions:write`, `job-titles:write`, `departments:write`): la UI oculta lo que el usuario no puede hacer.

## Capabilities and Constraints

- Stack: React 19, Vite, TypeScript, Tailwind v4, shadcn/ui, TanStack Query, Zustand, Axios, Sileo para notificaciones.
- Autenticación propia en la API: signup, login, /auth/me, JWT emitido por la API. Siempre existe un administrador sembrado con todos los permisos.
- Signup público crea usuarios con solo lectura (`employees:read`); un admin puede ampliar permisos.
- Salario como texto decimal; nunca aritmética con float.
- PATCH con tres estados: omitir, `null`, valor.
- Los mensajes de error de la API están en español y son aptos para mostrar.
- Sin paginación por `limit`/`offset`: cursor sobre id.

## Product Principles

- La jerarquía manda: todo se entiende desde quién reporta a quién.
- Un solo lugar de trabajo: nada que se pueda resolver en un drawer justifica una ruta nueva.
- Los errores de reglas de negocio se explican donde ocurren, con el campo y la causa.
- Lo sensible (salarios) se muestra con intención, no por defecto a la vista de todos.
- Rapidez de teclado y de ojo para quien repite la tarea cien veces.

## Accessibility & Inclusion

Formularios con labels y errores asociados, foco visible, navegación por teclado en tablas, drawers y árbol del organigrama. Contraste AA como mínimo.
