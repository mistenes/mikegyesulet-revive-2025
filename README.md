# Magyar Ifjúsági Konferencia – Revive 2025

This repository contains the refreshed HYCA/MIK website. The app no longer depends on Lovable or Supabase – content is stored locally during development and the codebase is prepared for a single Render web service backed by Postgres.

## Tech stack

- [Vite](https://vitejs.dev/) + React + TypeScript
- [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS
- Local data services (`newsService`, `pageContentService`, `settingsService`) with an accompanying API (`server.js`) that authenticates admins against Postgres and issues HTTP-only session cookies

## Getting started

```bash
npm install
npm run dev # frontend (http://localhost:5173)
npm run start # production-style build + API/static server (http://localhost:8080)
```

> Tip: keep `npm run start` running when you need `/admin/news` or other admin screens to persist data during development. The Vite dev server proxies `/api` to `http://localhost:8080`, so the admin UI can talk to the API without changing URLs.

### Environment variables

Create a `.env` file based on `.env.example`.

| Variable | Purpose |
| --- | --- |
| `VITE_ADMIN_EMAIL` | Front-end admin login e-mail (used for display defaults) |
| `VITE_ADMIN_PASSWORD` | Front-end admin login jelszó (used for display defaults) |
| `VITE_API_BASE_URL` | Base URL for the API service (leave empty for same-origin in production) |
| `DATABASE_URL` | Postgres connection string for the API service |
| `ADMIN_EMAIL` | Seeded admin e-mail stored in Postgres |
| `ADMIN_PASSWORD` | Seeded admin jelszó stored in Postgres |
| `ADMIN_JWT_SECRET` | Secret for signing admin session tokens |
| `FRONTEND_ORIGIN` | Allowed CORS origin for cookies (e.g., `http://localhost:5173`; optional on Render because `RENDER_EXTERNAL_URL` is used automatically) |
| `MAPBOX_TOKEN` | Server-side token exposed to the frontend via `/api/public/mapbox-token` for the regions map |
| `VITE_MAPBOX_TOKEN` | Optional direct token for local dev; overrides the API lookup when set |
| `IMAGEKIT_PUBLIC_KEY` | Public key used by the gallery ImageKit uploads |
| `IMAGEKIT_PRIVATE_KEY` | Private key used to sign ImageKit upload requests |
| `IMAGEKIT_URL_ENDPOINT` | Base URL endpoint for hosted ImageKit images |
| `IMAGEKIT_GALLERY_FOLDER` | Optional ImageKit folder path for gallery uploads (e.g., `hyca/gallery`) |
| `LOCAL_DEV_ORIGIN` | Override the allowed local origin for cookies; defaults to `http://localhost:5173` |

### Admin access

1. Visit `/auth`
2. Ensure `npm run start` is running with a reachable Postgres (`DATABASE_URL`)
3. Sign in with the credentials from `.env` (seeded into Postgres on boot)
4. Edit content via `/admin/pages`, `/admin/news`, and `/admin/settings`

All page sections are bilingual. When you edit or add news the Hungarian and English versions are saved together, and the home page updates instantly.

## Render blueprint

Use `render.yaml` to provision:

- a single Node/Express web service that builds/serves the Vite frontend and exposes the API
- a managed Postgres database

After importing the blueprint, Render wires Postgres into the `DATABASE_URL`. The API seeds the `admin_users` table with `ADMIN_EMAIL`/`ADMIN_PASSWORD` and secures routes with HTTP-only cookies while serving the built SPA from `dist`. CORS will automatically allow the deployed site using `RENDER_EXTERNAL_URL`; only set `FRONTEND_ORIGIN` when testing from a separate frontend origin (e.g., local Vite dev).

The blueprint leaves secrets (`MAPBOX_TOKEN`, `ADMIN_PASSWORD`, `ADMIN_JWT_SECRET`) blank so Render always prompts for them on deploy and keeps them in sync without needing manual YAML edits. Updating those values in the Render dashboard and redeploying will refresh the running environment.

For the regions map to render, set `MAPBOX_TOKEN` in the Render dashboard. The frontend fetches it from `/api/public/mapbox-token`, so no admin form is required.

## Tests / build

```bash
npm run build
```

## Folder highlights

- `src/services/*` – local storage backed services replacing Supabase
- `src/data/default*.ts` – bilingual seed content and news used on first load
- `render.yaml` – Render blueprint with a single web service plus Postgres

Feel free to adapt these services once the Render API is available.
