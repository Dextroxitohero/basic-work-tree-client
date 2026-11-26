# Módulo `drawers`

Los drawers laterales son la forma de abrir detalle y formularios sin crear rutas. El drawer abierto vive en la URL.

## Archivos

| Archivo | Contenido |
|---|---|
| `DrawerHost.tsx` | Lee `?drawer=` e `?id=` y monta el drawer correspondiente. Único punto de montaje (se renderiza en `Workspace`) |

`../hooks/useUrlState.ts` ofrece `get` y `patch` sobre los search params (`patch` con `undefined` borra la clave; `replace` evita llenar el historial).

## Drawers

| `drawer` | Componente | Estado |
|---|---|---|
| `employee` | `features/employees/EmployeeDrawer` | Hecho (lectura) |
| `employee-form` | alta y edición de empleado | Pendiente |
| `position-form` | asignar puesto | Pendiente |
| `department` | datos y empleados del departamento | Pendiente |
| `department-form` | alta y edición | Pendiente |
| `job-title-form` | alta, edición y desactivar | Pendiente |

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

- **Apilado (pendiente):** un drawer secundario (p. ej. `position-form` desde `employee`) se abre encima y su cierre vuelve al anterior. Máximo 2 niveles, parámetro `stack`.
- **Confirmaciones** (baja de empleado): `AlertDialog` sobre el drawer, no una ruta.
- **Cambios sin guardar:** cerrar un drawer con formulario modificado pide confirmación.
- **Móvil:** el `Sheet` ocupa el ancho disponible (máx. `sm:max-w-lg` en la ficha).
- El overlay no usa desenfoque: solo oscurece (`bg-foreground/25`).
- Cada drawer tiene carga, error con reintento y título accesible (`SheetTitle`, aunque sea `sr-only`).
