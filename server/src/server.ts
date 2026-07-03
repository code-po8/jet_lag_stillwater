import { buildApp } from './app.js'
import { getPool, closePool } from './db/pool.js'
import { runMigrations } from './db/migrate.js'
import { startExpirySweeper, type SweeperHandle } from './db/sweeper.js'
import { dbConnectionAuth } from './ws/auth.js'

/**
 * Entry point: build the app and start listening.
 *
 * Binds 0.0.0.0 and reads PORT from the environment so it works the same in
 * local Docker and on Railway. INFRA-007 wires the Railway service to this.
 */
const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? '0.0.0.0'
const isProd = process.env.NODE_ENV === 'production'

const databaseUrl = process.env.DATABASE_URL
const webOrigin = process.env.WEB_ORIGIN

// Deploy guard: in production the WS/CORS lock is only meaningful with a
// configured web origin. Warn loudly (don't hard-fail — a misconfigured origin
// shouldn't take the whole service down, but silence hides a broken multiplayer
// connection behind a healthy /health).
if (isProd && !webOrigin) {
  console.warn(
    '[startup] WEB_ORIGIN is not set in production: CORS is open and the WS ' +
      'origin lock is disabled. Set WEB_ORIGIN to the deployed web URL.',
  )
}

// Register room routes + start the sweeper when a database is configured.
// (Both skipped if DATABASE_URL is unset, e.g. a bare HTTP-layer smoke test.)
const db = databaseUrl ? getPool() : undefined
const app = buildApp({
  db,
  webOrigin,
  ws: db ? { auth: dbConnectionAuth(db), allowedOrigin: webOrigin } : undefined,
})

let sweeper: SweeperHandle | undefined

/**
 * Boot: apply pending migrations (hands-off deploys — a fresh DB is migrated
 * automatically), then start the sweeper and listen. Migrations run BEFORE
 * listen so the service never accepts traffic against a half-created schema; a
 * migration failure aborts startup rather than serving a broken API.
 */
async function start(): Promise<void> {
  if (databaseUrl) {
    const applied = await runMigrations({
      databaseUrl,
      logger: {
        info: (m) => app.log.info({ migrate: true }, m),
        warn: (m) => app.log.warn({ migrate: true }, m),
        error: (m) => app.log.error({ migrate: true }, m),
      },
    })
    if (applied.length) {
      app.log.info({ applied: applied.map((m) => m.name) }, 'database migrations applied')
    }
  }

  if (db) {
    sweeper = startExpirySweeper(db, {
      onSweep: (n) => {
        if (n > 0) app.log.info({ deleted: n }, 'expired sessions swept')
      },
      onError: (err) => app.log.error(err, 'session sweep failed'),
    })
  }

  await app.listen({ port, host })
}

start().catch((err) => {
  app.log.error(err, 'startup failed')
  process.exit(1)
})

// Graceful shutdown so container stop/restart doesn't drop connections abruptly.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    sweeper?.stop()
    app
      .close()
      .then(() => closePool())
      .then(
        () => process.exit(0),
        () => process.exit(1),
      )
  })
}
