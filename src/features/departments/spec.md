# Módulo `departments`

Departamentos y sus encargados.

## Archivos

| Archivo | Contenido | Estado |
|---|---|---|
| `hooks.ts` | `useDepartments` (todos, recorre el cursor), `useDepartmentNames` (id → nombre) | Hecho |
| `DepartmentsView.tsx` | Vista `?view=departments` | Pendiente |
| `DepartmentDrawer.tsx` | Drawer `department`: datos, encargado, empleados | Pendiente |
| `DepartmentFormDrawer.tsx` | Alta y edición | Pendiente |
| `mutations.ts`, `schemas.ts` | Mutaciones y zod | Pendiente |

## Endpoints

| Método | Ruta | Salida | Permiso |
|---|---|---|---|
| GET | `/departments` (`q`, `sort`, `order`, `after`) | `Page<Department>` | `employees:read` |
| GET | `/departments/{id}` | `Department` | `employees:read` |
| POST | `/departments` | 201 `Department` | `departments:write` |
| PATCH | `/departments/{id}` | `Department` | `departments:write` |

`Department = {id, name, manager_id, employee_count, created_at}`. `employee_count` cuenta empleados activos. El detalle **no** incrusta empleados: el drawer los pide con `GET /employees?department_id=` (paginado).

## Hooks existentes

| Hook | Comportamiento |
|---|---|
| `useDepartments` | Recorre todas las páginas con cursor (son pocos), `staleTime` 5 min. Alimenta el filtro de la tabla, los nombres y los selects |
| `useDepartmentNames` | Devuelve `(id) => nombre \| null` para pintar departamentos sin otra petición |

## Validaciones

| Campo | Regla |
|---|---|
| `name` | 1–100, sin espacios en los extremos |
| `manager_id` | Opcional; en PATCH, `null` quita al encargado |

En PATCH, `name` no acepta `null`.

## Reglas de negocio

| Regla | Error | En la UI |
|---|---|---|
| El nombre es único | 409 `department_name_exists` | Error en `name` |
| El encargado existe | 404 `employee_not_found` | Error en encargado |
| El encargado está activo | 409 `inactive_manager` | Error en encargado |

Invalidación: crear o editar → `departments.all`; si cambia el encargado, también `employees.all`.

## Diseño

El color de cada departamento sale de su id (`lib/dept-color.ts`): el mismo departamento tiene siempre el mismo tinte en avatar y punto.
