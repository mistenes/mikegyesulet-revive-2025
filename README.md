# Magyar Ifjúsági Konferencia – Revive 2025

This repository contains the refreshed HYCA/MIK website. The app no longer depends on Lovable or Supabase – content is stored locally during development and the codebase is prepared for a Render + Postgres deployment.

## Tech stack

- [Vite](https://vitejs.dev/) + React + TypeScript
- [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS
- Local data services (`newsService`, `pageContentService`, `settingsService`) with an accompanying API (`server.js`) that authenticates admins against Postgres and issues HTTP-only session cookies

## Getting started

```bash
npm install
npm run dev # frontend (http://localhost:5173)
npm run start # auth/API service (http://localhost:8080)
```

### Environment variables

Create a `.env` file based on `.env.example`.

| Variable | Purpose |
| --- | --- |
| `VITE_ADMIN_EMAIL` | Front-end admin login e-mail (used for display defaults) |
| `VITE_ADMIN_PASSWORD` | Front-end admin login jelszó (used for display defaults) |
| `VITE_API_BASE_URL` | Base URL for the API service (e.g., `http://localhost:8080`) |
| `DATABASE_URL` | Postgres connection string for the API service |
| `ADMIN_EMAIL` | Seeded admin e-mail stored in Postgres |
| `ADMIN_PASSWORD` | Seeded admin jelszó stored in Postgres |
| `ADMIN_JWT_SECRET` | Secret for signing admin session tokens |
| `FRONTEND_ORIGIN` | Allowed CORS origin for cookies (e.g., `http://localhost:5173`) |

### Admin access

1. Visit `/auth`
2. Ensure `npm run start` is running with a reachable Postgres (`DATABASE_URL`)
3. Sign in with the credentials from `.env` (seeded into Postgres on boot)
4. Edit content via `/admin/pages`, `/admin/news`, `/admin/settings` and `/admin/api-settings`

All page sections are bilingual. When you edit or add news the Hungarian and English versions are saved together, and the home page updates instantly.

## Render blueprint

Use `render.yaml` to provision:

- a static-site service for the Vite build
- a Node/Express API service connected to
- a managed Postgres database

After importing the blueprint, set `VITE_API_BASE_URL` for the static site and map the Postgres connection string into the API service. The API seeds the `admin_users` table with `ADMIN_EMAIL`/`ADMIN_PASSWORD` and secures routes with HTTP-only cookies.

## Tests / build

```bash
npm run build
```

## Folder highlights

- `src/services/*` – local storage backed services replacing Supabase
- `src/data/default*.ts` – bilingual seed content and news used on first load
- `render.yaml` – Render blueprint with static site + API + Postgres resources

Feel free to adapt these services once the Render API is available.
