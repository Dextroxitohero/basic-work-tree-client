# Módulo `employees`

Empleados: lista, ficha, alta, edición, baja y asignación de puestos.

## Archivos

| Archivo | Contenido | Estado |
|---|---|---|
| `EmployeesView.tsx` | Vista `?view=employees`: búsqueda, filtros, orden, tabla, «cargar más», estados | Hecho |
| `EmployeeDrawer.tsx` | Drawer `employee`: cabecera y pestañas Datos, Puestos, Reportes | Hecho (solo lectura) |
| `hooks.ts` | `useEmployeeList` (infinite query), `useEmployee` | Hecho |
| `EmployeeFormDrawer.tsx` | Alta y edición | Pendiente |
| `PositionFormDrawer.tsx` | Asignar puesto | Pendiente |
| `mutations.ts` | Crear, editar, baja, asignar puesto | Pendiente |
| `schemas.ts` | zod de los formularios | Pendiente |

## Endpoints que usa

| Método | Ruta | Para qué |
|---|---|---|
| GET | `/employees` | Tabla (paginada por cursor) |
| GET | `/employees/{id}` | Drawer (incluye historial y reportes directos) |
| POST / PATCH / DELETE | `/employees` ... | Formularios y baja (pendiente) |
| POST | `/employees/{id}/positions` | Asignar puesto (pendiente) |

## Vista de lista

| Elemento | Comportamiento |
|---|---|
| Búsqueda | Campo local con debounce de 300 ms; llega a la URL (`q`) y a la API |
| Estado | `active` (defecto), `inactive`, `all`; param `status`. `all` omite `is_active` |
| Departamento | Select con los departamentos; param `dept` |
| Orden | `last_name:asc` (defecto), `last_name:desc`, `hire_date:desc`, `hire_date:asc`; param `sort` |
| Paginación | `useInfiniteQuery` con `next_cursor`; botón «Cargar más» |
| Contador | `N personas`; con `+` si hay más páginas |
| Fila | Clic o Enter/Espacio abre `?drawer=employee&id=` |

Al cambiar filtros se conserva la tabla anterior mientras llega la nueva (`keepPreviousData`).

### Columnas por ancho

| Ancho | Columnas |
|---|---|
| < lg | Empleado (con departamento bajo el email), Estado |
| lg | + Departamento |
| xl | + Puesto, Ingreso |

### Estados

| Estado | Tratamiento |
|---|---|
| Carga | 8 filas skeleton |
| Vacío sin filtros | «Aún no hay empleados» |
| Vacío con filtros | «Nadie coincide…» con botón «Quitar filtros» |
| Error | «No se pudo cargar la lista» con «Reintentar» |

## Drawer de ficha

| Pestaña | Contenido |
|---|---|
| Datos | Email, teléfono, departamento, ingreso, salario actual con botón de ocultar (preferencia en `useUiStore`) |
| Puestos | Historial ordenado por inicio descendente; el abierto lleva «Actual» |
| Reportes | Reportes directos; clic cambia el drawer a esa persona |

La pestaña vive en `?tab=`. El drawer tiene carga (skeleton), error con reintento.

## Reglas de negocio que la UI refleja

| Regla de la API | Error | En la UI |
|---|---|---|
| Email único | 409 `email_already_exists` | Error en `email` |
| Jefe existente y activo | 404 `employee_not_found`, 409 `inactive_manager` | Error en el campo jefe |
| Sin ciclos de jefes | 409 `circular_manager_reference` | Error en el campo jefe |
| Departamento existente | 404 `department_not_found` | Error en departamento |
| `hire_date` no futura | 422 | Error en el campo |

**Baja** (pendiente de UI): cierra el puesto actual con la fecha de hoy, deja sin jefe a sus subordinados y sin encargado a sus departamentos; conserva el historial; al reactivar no se recuperan. El diálogo de confirmación debe explicarlo. Invalida `employees.all` y `departments.all`.

## Reglas de formulario (pendiente)

- Los selects de jefe y departamento usan combobox con búsqueda en servidor (`q`); el jefe solo ofrece activos y no a sí mismo.
- Asignar puesto: solo puestos activos; avisa de que el actual se cierra el día anterior al inicio; deshabilitado si el empleado está inactivo.
- PATCH envía solo los campos modificados; `phone`, `manager_id`, `department_id` aceptan `null`.

## Pendiente conocido

- Botón «Nuevo empleado» (depende del drawer de alta).
- La tabla no muestra a quién reporta cada persona; la jerarquía se lee en la pestaña Reportes y, cuando exista, en el organigrama.
- Badge «Activo» de la cabecera del drawer sigue siendo píldora; en la tabla ya es punto con texto.
