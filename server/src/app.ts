import Fastify, { type FastifyInstance } from 'fastify'

export interface BuildAppOptions {
  /** Enable Fastify's logger. Defaults to true; tests pass false to stay quiet. */
  logger?: boolean
}

/**
 * Build the Fastify application instance (without starting to listen).
 *
 * Kept separate from server.ts so tests can exercise routes via `app.inject()`
 * without binding a port. Room/sync routes and the WebSocket gateway are added
 * in later stories (INFRA-005/006); this is the skeleton (INFRA-003).
 */
export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? true,
  })

  // Liveness/readiness probe — used by Docker/Railway health checks.
  app.get('/health', async () => {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }
  })

  return app
}
