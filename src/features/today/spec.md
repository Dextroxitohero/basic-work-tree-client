# Módulo `today`

Vista «Hoy»: lo que importa al abrir la app. Es la vista por defecto (`/` sin `?view=`). **Solo usa datos reales de la API**: no hay endpoint de métricas ni de alertas, así que todo se deriva de listados existentes.

## Archivos

| Archivo | Contenido |
|---|---|
| `TodayView.tsx` | Tarjeta de personas, resumen de atención, pulso de departamentos, lista de acciones e ingresos recientes |
| `useAttention.ts` | Pendientes derivados; los usan «Hoy», la campana y el contador del menú |

## Datos

| Bloque | Fuente | Cálculo |
|---|---|---|
| Personas activas en departamentos | `GET /departments` (todas las páginas) | Suma de `employee_count`. No incluye a quien no tiene departamento: el título lo dice |
| Barra de distribución y leyenda | Igual | Proporción por departamento, con el color estable de cada uno |
| Pulso de departamentos | Igual | Personas, barra relativa al mayor y píldora «Con encargado» / «Sin encargado» (`manager_id`) |
| Ingresos recientes | `GET /employees?is_active=true&sort=hire_date&order=desc` | Primeros 5 de la primera página |
| Pendientes | Departamentos + `GET /employees?has_manager=false&is_active=true` | Ver abajo |

## Pendientes (`useAttention`)

| Pendiente | Condición | Acción |
|---|---|---|
| «X no tiene encargado» | Departamento con `manager_id` nulo | «Asignar encargado» (con `departments:write`; si no, «Ver departamento») |
| «N personas están en la cima sin jefe» | Más de un empleado activo sin jefe | «Ver organigrama» |

Si hay más de una página de raíces, se muestra `N+`. No se inventan alertas que la API no pueda sostener (por ejemplo, empleados sin puesto: no hay filtro para contarlos).

## Estados

Carga (skeleton por bloque), vacío (sin personas, sin departamentos, sin empleados), error del pulso con «Reintentar», y «Todo en orden» cuando no hay pendientes.

## Diseño

Basado en una referencia aportada por el usuario (panel con tarjetas flotantes, índigo profundo, píldoras de estado). Se tomó el lenguaje visual, no la marca ni sus indicadores de negocio.
