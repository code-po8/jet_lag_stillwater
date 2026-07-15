import Fastify, { type FastifyInstance } from 'fastify'
import fastifyWebsocket from '@fastify/websocket'
import fastifyCors from '@fastify/cors'
import { roomRoutes } from './rooms/routes.js'
import type { Queryable } from './rooms/repository.js'
import { RoomHubRegistry } from './ws/registry.js'
import { registerWsGateway, type ConnectionAuth } from './ws/gateway.js'

/**
 * Parse the `WEB_ORIGIN` value into a list of allowed origins.
 *
 * Accepts a single origin or a comma-separated list (e.g. the Railway default
 * URL plus a custom domain). Whitespace around each entry is trimmed and empty
 * entries are dropped, so `"a, b,"` yields `["a", "b"]`. Returns an empty array
 * when nothing usable is configured, which the caller treats as "CORS open".
 */
export function parseWebOrigins(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0)
}

export interface BuildAppOptions {
  /** Enable Fastify's logger. Defaults to true; tests pass false to stay quiet. */
  logger?: boolean
  /**
   * Allowed browser origin(s) — the deployed `web` URL(s). Accepts a single
   * origin or a comma-separated list (custom domain + Railway URL). When set,
   * CORS and the WS upgrade are locked to these origins. Defaults to
   * `process.env.WEB_ORIGIN`; if neither is set, CORS is open (local dev).
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
    /**
     * Lock WS connections to this origin, or a comma-separated list of origins
     * (defaults to webOrigin).
     */
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

  // CORS: lock to the deployed web origin(s) when known (INFRA-007); open
  // locally. Accepts a comma-separated list so a custom domain and the Railway
  // default URL can both be allowed.
  const webOrigins = parseWebOrigins(options.webOrigin ?? process.env.WEB_ORIGIN)
  app.register(fastifyCors, {
    origin: webOrigins.length ? webOrigins : true,
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
    const allowedOrigins = parseWebOrigins(
      options.ws.allowedOrigin ?? options.webOrigin ?? process.env.WEB_ORIGIN,
    )
    app.register(fastifyWebsocket, {
      options: allowedOrigins.length
        ? {
            // Lock WS upgrades to the deployed web origin(s) (INFRA-007).
            verifyClient: (
              info: { origin?: string },
              next: (ok: boolean, code?: number, message?: string) => void,
            ) => {
              if (info.origin !== undefined && allowedOrigins.includes(info.origin)) next(true)
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
