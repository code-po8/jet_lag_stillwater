import { buildApp } from './app.js'

/**
 * Entry point: build the app and start listening.
 *
 * Binds 0.0.0.0 and reads PORT from the environment so it works the same in
 * local Docker and on Railway. INFRA-007 wires the Railway service to this.
 */
const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? '0.0.0.0'

const app = buildApp()

app.listen({ port, host }).catch((err) => {
  app.log.error(err)
  process.exit(1)
})

// Graceful shutdown so container stop/restart doesn't drop connections abruptly.
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    app.close().then(
      () => process.exit(0),
      () => process.exit(1),
    )
  })
}
