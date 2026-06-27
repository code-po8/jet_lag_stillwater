import Fastify, { type FastifyInstance } from 'fastify'
import { roomRoutes } from './rooms/routes.js'
import type { Queryable } from './rooms/repository.js'

export interface BuildAppOptions {
  /** Enable Fastify's logger. Defaults to true; tests pass false to stay quiet. */
  logger?: boolean
  /**
   * Database handle. When provided, the room REST routes are registered.
   * Omitted for bare HTTP-layer tests that only need /health.
   */
  db?: Queryable
}

/**
 * Build the Fastify application instance (without starting to listen).
 *
 * Kept separate from server.ts so tests can exercise routes via `app.inject()`
 * without binding a port. The WebSocket gateway is added in INFRA-006.
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

  // Room control-plane routes (INFRA-005), registered when a DB is available.
  if (options.db) {
    app.register(roomRoutes, { db: options.db })
  }

  return app
}
