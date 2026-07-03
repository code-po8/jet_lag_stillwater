# Railway deployment (INFRA-007)

One Railway **project** with three services + the Postgres plugin. The two app
services map 1:1 to the local `docker-compose.yml` services (`web` ↔ `frontend`,
`api` ↔ `backend`).

> ⚠️ **You must do the account-linked steps** (create the project, link the repo,
> add the Postgres plugin, set variables, deploy). This repo provides the build
> config; it cannot run `railway up` for you.

## Services

| Railway service | Maps to (compose) | Builds with         | Serves              |
| --------------- | ----------------- | ------------------- | ------------------- |
| `web`           | `frontend`        | `Dockerfile.web`    | static `dist/` PWA  |
| `api`           | `backend`         | `server/Dockerfile` | Fastify + WS        |
| Postgres        | `postgres`        | Railway plugin      | DB (`DATABASE_URL`) |

## Config-as-code

Per-service build/deploy settings are pinned in the repo so they don't drift or
need re-clicking each deploy:

- `railway.web.toml` — the `web` service (builder, `Dockerfile.web`).
- `railway.api.toml` — the `api` service (builder, `server/Dockerfile`, health
  check, `numReplicas = 1`).

To activate each, point the service at its file **once**: Service → Settings →
**Config-as-code** → Path = `railway.web.toml` (resp. `railway.api.toml`).

What these files **can't** hold (environment-specific / account-scoped — set in
the dashboard): the `DATABASE_URL` reference, `WEB_ORIGIN`, `VITE_API_URL`
_values_, and the generated public domains.

## Setup — from an empty project (ordered)

Do these in order; later steps need URLs from earlier ones.

### 1. Create the project + Postgres

1. New Railway project → connect this GitHub repo (this becomes the **`web`**
   service by default).
2. **+ Add → Database → PostgreSQL.** (Nothing else is needed for the DB — the
   `api` migrates it on first boot.)

### 2. `api` service (Fastify backend)

1. **+ Add → GitHub Repo →** this same repo. This creates a **second** service.
2. Service → **Settings → Config-as-code → Path** = `railway.api.toml`. That
   pins the builder = Dockerfile, `dockerfilePath = server/Dockerfile`, the
   `/health` check, and `numReplicas = 1`.
   - ⚠️ **New services default to the "Railpack" builder.** If you don't set the
     config path (or set the builder to Dockerfile manually), Railpack will
     auto-guess the build and ignore `server/Dockerfile`. The `.toml` fixes this.
   - Leave **Root Directory** empty (repo root): the `server/Dockerfile` context
     needs `shared/` + `server/`.
3. **Settings → Networking → Generate Domain** (gives it a public URL, e.g.
   `https://<api>.up.railway.app`).
4. **Variables:**
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (use your Postgres service's
     actual name) — links the DB.
   - `WEB_ORIGIN` = the `web` service's public URL, e.g.
     `https://<web>.up.railway.app` (locks CORS **and** the WS origin; exact,
     `https://`, no trailing slash).
   - (Railway sets `PORT`; the server binds `0.0.0.0` and reads it.)
5. Deploy, then **verify**: open `https://<api>.up.railway.app/health` → it must
   return JSON `{"status":"ok",...}`. If you instead see the navy app shell,
   you're hitting the `web` service — check the domain.

Migrations are **automatic**: on boot the server applies pending SQL migrations
from `server/migrations` before it listens (idempotent, safe on every restart).
No manual `migrate:up`.

### 3. `web` service (static PWA)

1. Service → **Settings → Config-as-code → Path** = `railway.web.toml` (pins
   builder = Dockerfile, `dockerfilePath = Dockerfile.web`).
2. **Variables → `VITE_API_URL`** = the **api** service URL from step 2 (e.g.
   `https://<api>.up.railway.app`; `https://`, no trailing slash, **not** the web
   URL). This is a **build-time** value — Vite inlines it (`import.meta.env`),
   and `Dockerfile.web` receives it via `ARG VITE_API_URL`.
3. **Redeploy** the web service (a fresh **build** — not a restart; a restart
   reuses the old bundle with the old/empty URL baked in).

### 4. Verify multiplayer

Open the `web` URL, **hard-reload** (`Ctrl+Shift+R` — the old bundle may be
cached), DevTools → Network → click **Create Room**. The `POST /rooms` request
**Host** should be the **api** domain and return **201**. If it's still the web
domain (405, or 200 returning HTML), `VITE_API_URL` didn't bake in — recheck
step 3 (set on the _web_ service, then _rebuilt_).

> If `VITE_API_URL` is missing from a production build, the client now fails
> loudly with a clear "Server not configured" error instead of a silent
> same-origin 405 (see `getApiBaseUrl` in `src/services/sync/roomApi.ts`,
> issue #3).

## WebSockets

`wss://` works over Railway's standard HTTPS port — the server listens on
`process.env.PORT` / `0.0.0.0` and uses an app-level heartbeat. With
`WEB_ORIGIN` set, the gateway rejects WS upgrades from any other origin.

## Local ↔ Railway parity

`docker compose up` runs the same three services locally (`frontend`, `backend`,
`postgres`). The only differences are: Railway injects `PORT`/`DATABASE_URL`,
and you set `WEB_ORIGIN`/`VITE_API_URL` to the deployed URLs instead of
localhost.
