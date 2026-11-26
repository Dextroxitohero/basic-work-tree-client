# Work Tree Client

Cliente web de la Employee Work Tree API: empleados, organigrama, departamentos, puestos y usuarios.

React 19 · Vite · TypeScript · Tailwind v4 · shadcn/ui · TanStack Query · Zustand · Axios · Sileo.

## Empezar

```bash
npm install
npm run dev
```

### ¿A qué API habla?

Una bandera, `VITE_API_TARGET`, elige entre las dos URLs de `.env`:

| Valor | API |
|---|---|
| `production` (por defecto) | `https://basic-work-tree-api-production.up.railway.app` |
| `local` | `http://localhost:8010` |

Para cambiarla en tu máquina, crea `.env.local` (no se versiona) con `VITE_API_TARGET=local`. En desarrollo el navegador llama a `/api/...` en el mismo origen y el proxy de Vite lo reenvía a la API elegida (evita CORS). En el build, el cliente llama directo a la URL elegida, y esa API debe permitir su origen en `CORS_ORIGINS`.

**Railway (front):** no necesita variables; el build usa `.env`. Para forzar otra API, define `VITE_API_TARGET` en el servicio y redespliega (se aplica al compilar).

## Documentación

- `spec.md`: contrato transversal del cliente.
- `src/**/spec.md`: un spec por módulo (`api`, `auth`, `employees`, `departments`, `job-titles`, `org-chart`, `users`, `drawers`, `layout`, `lib`).
- `PRODUCT.md`: usuarios, propósito y principios de producto.
- `BACKEND-CHANGES.md`: cambios que el cliente pidió a la API (ya desplegados).

## Scripts

`npm run dev` · `npm run build` · `npm run lint` · `npm run preview`
