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

## Setup (Railway dashboard or CLI)

1. **Create project** and connect this GitHub repo.
2. **Add the Postgres plugin** — it injects `DATABASE_URL` into services you
   attach it to. Attach it to `api`.
3. **`api` service:**
   - Root directory: repo root (the `server/Dockerfile` build context needs
     `shared/` + `server/`).
   - Dockerfile path: `server/Dockerfile`.
   - Variables:
     - `DATABASE_URL` — from the Postgres plugin (reference variable).
     - `WEB_ORIGIN` — the `web` service's public URL, e.g.
       `https://<web>.up.railway.app` (locks CORS **and** the WS origin).
     - `PORT` / `HOST` — Railway sets `PORT`; the server binds `0.0.0.0`.
   - **Single instance only (v1):** the `RoomHub` is in-memory, so do **not**
     scale `api` past 1 replica until a Redis fan-out is added. Set
     replicas/horizontal scaling = 1. (With the auto-migrate-on-boot below, a
     second replica would also race to apply migrations — another reason to keep
     it at 1 for now.)
   - Migrations: **automatic** — on boot the server applies any pending SQL
     migrations from `server/migrations` (via node-pg-migrate's programmatic
     runner) before it starts listening. A fresh Railway Postgres is migrated on
     the first deploy with no manual step. It's idempotent, so restarts/redeploys
     are safe. (No `WEB_ORIGIN` / manual `migrate:up` needed.)
   - Health check path: `/health`.
4. **`web` service:**
   - Dockerfile path: `Dockerfile.web`.
   - Build-time variable: `VITE_API_URL` = the `api` service public URL
     (e.g. `https://<api>.up.railway.app`). The client derives the `wss://` URL
     from it (`getWsUrl()`), so `wss://` connects to `api`.
5. **Deploy** both services. Open the `web` URL on a phone to play.

## WebSockets

`wss://` works over Railway's standard HTTPS port — the server listens on
`process.env.PORT` / `0.0.0.0` and uses an app-level heartbeat. With
`WEB_ORIGIN` set, the gateway rejects WS upgrades from any other origin.

## Local ↔ Railway parity

`docker compose up` runs the same three services locally (`frontend`, `backend`,
`postgres`). The only differences are: Railway injects `PORT`/`DATABASE_URL`,
and you set `WEB_ORIGIN`/`VITE_API_URL` to the deployed URLs instead of
localhost.
