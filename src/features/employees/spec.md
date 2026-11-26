# Módulo `employees`

Empleados: lista, ficha, alta, edición, baja y asignación de puestos.

## Archivos

| Archivo | Contenido | Estado |
|---|---|---|
| `EmployeesView.tsx` | Vista `?view=employees`: búsqueda, filtros, orden, tabla, «cargar más», estados | Hecho |
| `EmployeeDrawer.tsx` | Drawer `employee`: cabecera con acciones y pestañas Datos, Puestos, Reportes | Hecho |
| `EmployeeFormDrawer.tsx` | Drawer `employee-form`: alta (sin `id`) y edición (con `id`) | Hecho |
| `PositionFormDrawer.tsx` | Drawer `position-form`: asignar puesto | Hecho |
| `hooks.ts` | `useEmployeeList` (infinite query), `useEmployee` | Hecho |
| `mutations.ts` | `useCreateEmployee`, `useUpdateEmployee`, `useDeactivateEmployee`, `useReactivateEmployee`, `useAssignPosition` | Hecho |

Los esquemas zod viven dentro de cada formulario.

## Endpoints que usa

| Método | Ruta | Para qué |
|---|---|---|
| GET | `/employees` | Tabla (paginada por cursor) |
| GET | `/employees/{id}` | Drawer (incluye historial y reportes directos) |
| POST | `/employees` | Alta |
| PATCH | `/employees/{id}` | Edición y reactivación (`is_active: true`) |
| DELETE | `/employees/{id}` | Baja |
| POST | `/employees/{id}/positions` | Asignar puesto |

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

**Baja:** cierra el puesto actual con la fecha de hoy, deja sin jefe a sus subordinados y sin encargado a sus departamentos; conserva el historial; al reactivar no se recuperan. Un `AlertDialog` lo explica antes de confirmar. Invalida `employees.all` y `departments.all`. **Reactivar** es un `PATCH {is_active: true}`.

## Formularios

| Formulario | Comportamiento |
|---|---|
| Alta | Nombre, apellido, email, teléfono (opcional), fecha de ingreso, departamento y jefe (opcionales). El body omite los opcionales vacíos. Al crear, abre la ficha del nuevo empleado |
| Edición | Email y fecha de ingreso son de **solo lectura** (no se pueden cambiar) y **no se validan**: un email que la API aceptó puede no pasar el `.email()` de zod. El PATCH envía solo los campos modificados; vaciar `phone`, jefe o departamento envía `null`. Sin cambios, solo vuelve a la ficha |
| Asignar puesto | Puesto activo, salario (texto, ≤ 2 decimales, > 0), inicio no futuro, notas ≤ 500. Avisa de que el puesto actual se cierra el día anterior. Con el empleado de baja, el formulario no se puede enviar |

- Jefe: `EmployeePicker` (combobox con búsqueda en servidor, solo activos, excluye al propio empleado). Departamento: select con la lista completa.
- No se usa `disabled` para campos de solo lectura: `react-hook-form` devuelve `undefined` para ellos y rompería la validación.
- Errores de campo: `email_already_exists` → email; `inactive_manager`, `circular_manager_reference`, `employee_not_found` → jefe; `department_not_found` → departamento; `overlapping_position` → inicio; `job_title_inactive` → puesto. Un 409/422 sin campo sale como toast.
- Cerrar con cambios sin guardar pide confirmación. La edición y la asignación vuelven a la ficha al terminar.

## Pendiente conocido

- La tabla no muestra a quién reporta cada persona; la jerarquía se lee en la pestaña Reportes y en el organigrama.
- Reactivar no pide confirmación.
