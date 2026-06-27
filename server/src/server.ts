import { buildApp } from './app.js'
import { getPool, closePool } from './db/pool.js'
import { startExpirySweeper, type SweeperHandle } from './db/sweeper.js'

/**
 * Entry point: build the app and start listening.
 *
 * Binds 0.0.0.0 and reads PORT from the environment so it works the same in
 * local Docker and on Railway. INFRA-007 wires the Railway service to this.
 */
const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? '0.0.0.0'

const app = buildApp()

// Start the expired-room sweeper when a database is configured. (Skipped if
// DATABASE_URL is unset, e.g. a bare smoke test of the HTTP layer.)
let sweeper: SweeperHandle | undefined
if (process.env.DATABASE_URL) {
  sweeper = startExpirySweeper(getPool(), {
    onSweep: (n) => {
      if (n > 0) app.log.info({ deleted: n }, 'expired sessions swept')
    },
    onError: (err) => app.log.error(err, 'session sweep failed'),
  })
}

app.listen({ port, host }).catch((err) => {
  app.log.error(err)
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
