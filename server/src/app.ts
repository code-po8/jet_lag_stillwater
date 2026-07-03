import Fastify, { type FastifyInstance } from 'fastify'
import fastifyWebsocket from '@fastify/websocket'
import fastifyCors from '@fastify/cors'
import { roomRoutes } from './rooms/routes.js'
import type { Queryable } from './rooms/repository.js'
import { RoomHubRegistry } from './ws/registry.js'
import { registerWsGateway, type ConnectionAuth } from './ws/gateway.js'

export interface BuildAppOptions {
  /** Enable Fastify's logger. Defaults to true; tests pass false to stay quiet. */
  logger?: boolean
  /**
   * Allowed browser origin (the deployed `web` URL). When set, CORS is locked to
   * it. Defaults to `process.env.WEB_ORIGIN`; if neither is set, CORS is open
   * (local dev convenience).
   */
  webOrigin?: string
  /**
   * Database handle. When provided, the room REST routes are registered.
   * Omitted for bare HTTP-layer tests that only need /health.
   */
  db?: Queryable
  /**
   * When provided, the WebSocket gateway is registered. Supplies the auth
   * resolver (code + rejoin token -> player) and an optional shared registry.
   */
  ws?: {
    auth: ConnectionAuth
    registry?: RoomHubRegistry
    batchIntervalMs?: number
    heartbeatMs?: number
    /** Lock WS connections to this origin (defaults to webOrigin). */
    allowedOrigin?: string
    /** Persist a hider assignment so it survives reconnect (see GatewayOptions). */
    persistHiderRole?: (code: string, hiderId: string) => Promise<void>
  }
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

  // CORS: lock to the deployed web origin when known (INFRA-007); open locally.
  const webOrigin = options.webOrigin ?? process.env.WEB_ORIGIN
  app.register(fastifyCors, {
    origin: webOrigin ? [webOrigin] : true,
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

  // WebSocket data-plane gateway (INFRA-006), registered when configured.
  if (options.ws) {
    const registry = options.ws.registry ?? new RoomHubRegistry()
    const allowedOrigin = options.ws.allowedOrigin ?? webOrigin
    app.register(fastifyWebsocket, {
      options: allowedOrigin
        ? {
            // Lock WS upgrades to the deployed web origin (INFRA-007).
            verifyClient: (
              info: { origin?: string },
              next: (ok: boolean, code?: number, message?: string) => void,
            ) => {
              if (info.origin === allowedOrigin) next(true)
              else next(false, 403, 'origin not allowed')
            },
          }
        : undefined,
    })
    app.register(async (scoped) => {
      await registerWsGateway(scoped, {
        registry,
        auth: options.ws!.auth,
        persistHiderRole: options.ws!.persistHiderRole,
        batchIntervalMs: options.ws!.batchIntervalMs,
        heartbeatMs: options.ws!.heartbeatMs,
      })
    })
  }

  return app
}
