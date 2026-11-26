# Módulo `drawers`

Los drawers laterales son la forma de abrir detalle y formularios sin crear rutas. El drawer abierto vive en la URL.

## Archivos

| Archivo | Contenido |
|---|---|
| `DrawerHost.tsx` | Lee `?drawer=` e `?id=` y monta el drawer. Los formularios solo se montan con permiso de escritura |
| `useDrawer.ts` | `open(drawer, id?)`, `close()`, `drawer`, `id` sobre la URL |

`../hooks/useUrlState.ts` ofrece `get` y `patch` sobre los search params (`patch` con `undefined` borra la clave; `replace` evita llenar el historial).

## Drawers

| `drawer` | Componente | Estado |
|---|---|---|
| `employee` | `employees/EmployeeDrawer` | Hecho |
| `employee-form` | `employees/EmployeeFormDrawer` (alta sin `id`, edición con `id`) | Hecho |
| `position-form` | `employees/PositionFormDrawer` (`id` = empleado) | Hecho |
| `department` | `departments/DepartmentDrawer` | Hecho |
| `department-form` | `departments/DepartmentFormDrawer` | Hecho |
| `job-title-form` | `job-titles/JobTitleFormDrawer` | Hecho |

## Parámetros de URL

| Param | Significado |
|---|---|
| `view` | Vista activa del workspace |
| `drawer` | Drawer abierto |
| `id` | Id de la entidad del drawer |
| `tab` | Pestaña activa dentro del drawer (`replace`, sin historial) |
| `stack` | Drawer secundario apilado (pendiente) |

Cerrar un drawer borra `drawer`, `id` y `tab`.

## Reglas

- **Un drawer a la vez:** abrir un formulario desde la ficha reemplaza el drawer; al guardar o cancelar vuelve a la ficha (`open('employee', id)`). El apilado con `stack` no se implementó.
- **Confirmaciones** (baja de empleado): `AlertDialog` sobre el drawer, no una ruta.
- **Cambios sin guardar:** `FormDrawer` pide confirmación al cerrar con el formulario modificado (Escape, X o Cancelar).
- **Móvil:** el `Sheet` ocupa el ancho disponible (máx. `sm:max-w-lg` en la ficha).
- El overlay no usa desenfoque: solo oscurece (`bg-foreground/25`).
- Cada drawer tiene carga, error con reintento y título accesible (`SheetTitle`, aunque sea `sr-only`).
