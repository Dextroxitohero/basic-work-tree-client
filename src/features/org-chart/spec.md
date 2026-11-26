# Módulo `org-chart`

Organigrama: la jerarquía de jefes y reportes. Es el módulo que materializa el principio «la jerarquía manda» de `PRODUCT.md`.

## Archivos

| Archivo | Contenido |
|---|---|
| `OrgChartView.tsx` | Vista `?view=org-chart`: selector de raíz, `Tree` y `Node` recursivo con colapso (hecho) |

## Endpoints

| Método | Ruta | Salida |
|---|---|---|
| GET | `/employees?has_manager=false&is_active=true` | `Page<Employee>`: candidatos a raíz |
| GET | `/employees/{id}/tree` | `EmployeeTreeNode` recursivo |

`EmployeeTreeNode = {employee: Employee, reports: EmployeeTreeNode[]}`.

## Comportamiento

- **Raíz:** por defecto, el único empleado activo sin jefe. Si hay varios, un selector; la elegida va en la URL (`root`).
- **Nodo:** avatar con tinte de departamento, nombre, puesto y número de reportes. Clic abre `?drawer=employee&id=`.
- **Árbol:** lista indentada con roles ARIA `tree`/`treeitem`; colapso por nodo (los dos primeros niveles abiertos). Cada nodo y su botón de colapso son botones nativos, navegables con Tab; falta la navegación con flechas.
- **Bajas:** el árbol solo trae empleados activos; la baja ya reasigna a sus subordinados a «sin jefe», por lo que pueden aparecer como nuevas raíces.
- Un árbol grande no se pagina: si crece, la API necesitaría `depth` (decisión futura).

## Estados

Carga (skeleton del árbol), vacío («Aún no hay jerarquía»), error con reintento, sin permiso.

## Invalidación

Cualquier cambio de jefe (alta, edición, baja) invalida `employees.all`, que cubre el árbol (`keys.employees.tree`).

## Pendiente

Navegación con flechas. Mover jefes arrastrando nodos (fuera de la primera versión). Los ciclos los decide la API (409 `circular_manager_reference`), así que no habría que duplicar esa lógica en el cliente.
