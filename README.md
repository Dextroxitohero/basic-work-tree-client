# Work Tree Client

Cliente web de la Employee Work Tree API: empleados, organigrama, departamentos, puestos y usuarios.

React 19 · Vite · TypeScript · Tailwind v4 · shadcn/ui · TanStack Query · Zustand · Axios · Sileo.

## Empezar

```bash
npm install
cp .env.example .env.local   # por defecto habla con la API de Railway
npm run dev
```

En desarrollo el navegador llama a `/api/...` en el mismo origen y el proxy de Vite lo reenvía a `API_PROXY_TARGET` (evita CORS). Para una API local, pon `API_PROXY_TARGET=http://localhost:8000`.

## Documentación

- `spec.md`: contrato transversal del cliente.
- `src/**/spec.md`: un spec por módulo (`api`, `auth`, `employees`, `departments`, `job-titles`, `org-chart`, `users`, `drawers`, `layout`, `lib`).
- `PRODUCT.md`: usuarios, propósito y principios de producto.
- `BACKEND-CHANGES.md`: cambios que el cliente pidió a la API (ya desplegados).

## Scripts

`npm run dev` · `npm run build` · `npm run lint` · `npm run preview`
