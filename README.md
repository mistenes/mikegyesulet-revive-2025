# Magyar Ifjúsági Konferencia – Revive 2025

This repository contains the refreshed HYCA/MIK website. The app no longer depends on Lovable or Supabase – content is stored locally during development and the codebase is prepared for a Render + Postgres deployment.

## Tech stack

- [Vite](https://vitejs.dev/) + React + TypeScript
- [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS
- Local data services (`newsService`, `pageContentService`, `settingsService`) that will later map to the Render API + Postgres instance

## Getting started

```bash
npm install
npm run dev
```

### Environment variables

Create a `.env` file based on `.env.example`.

| Variable | Purpose |
| --- | --- |
| `VITE_ADMIN_EMAIL` | Front-end admin login e-mail |
| `VITE_ADMIN_PASSWORD` | Front-end admin login jelszó |
| `VITE_API_BASE_URL` | (Optional) upcoming Render API endpoint |

### Admin access

1. Visit `/auth`
2. Sign in with the credentials from `.env`
3. Edit content via `/admin/pages`, `/admin/news`, `/admin/settings` and `/admin/api-settings`

All page sections are bilingual. When you edit or add news the Hungarian and English versions are saved together, and the home page updates instantly.

## Render blueprint

Use `render.yaml` to provision:

- a static-site service for the Vite build
- a Node/Express API service (to be implemented) connected to
- a managed Postgres database

After importing the blueprint, set `VITE_API_BASE_URL` for the static site and map the Postgres connection string into the API service.

## Tests / build

```bash
npm run build
```

## Folder highlights

- `src/services/*` – local storage backed services replacing Supabase
- `src/data/default*.ts` – bilingual seed content and news used on first load
- `render.yaml` – Render blueprint with static site + API + Postgres resources

Feel free to adapt these services once the Render API is available.
