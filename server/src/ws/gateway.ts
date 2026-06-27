import type { FastifyInstance } from 'fastify'
import type { WebSocket } from '@fastify/websocket'
import type { ClientMessage, ServerMessage, PublicPlayer } from '@shared'
import { RoomHubRegistry } from './registry.js'
import type { RoomHub } from './roomHub.js'

/** How a connecting socket is authenticated + resolved to a player. */
export interface ConnectionAuth {
  /**
   * Verify a (code, rejoinToken) pair. Returns the player to attach, or null if
   * the room/token is invalid.
   */
  resolve(code: string, rejoinToken: string): Promise<{ player: PublicPlayer } | null>
}

export interface GatewayOptions {
  registry: RoomHubRegistry
  auth: ConnectionAuth
  /** Position broadcast tick (ms). Default 1000. */
  batchIntervalMs?: number
  /** Heartbeat ping interval (ms). Default 15000. */
  heartbeatMs?: number
}

interface SocketCtx {
  playerId: string
  code: string
  hub: RoomHub
  alive: boolean
}

function send(socket: WebSocket, msg: ServerMessage): void {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(msg))
  }
}

/**
 * WebSocket gateway (INFRA-006). Registers the `/ws` route and wires sockets to
 * the in-memory RoomHubs: hello/welcome handshake, presence, position
 * coalescing/broadcast, hider-withholding (via RoomHub), and zone.breach.
 */
export async function registerWsGateway(app: FastifyInstance, opts: GatewayOptions): Promise<void> {
  const { registry, auth } = opts
  const batchIntervalMs = opts.batchIntervalMs ?? 1000
  const heartbeatMs = opts.heartbeatMs ?? 15_000

  // Track the sockets per room so we can broadcast.
  const socketsByCode = new Map<string, Map<string, WebSocket>>()

  function roomSockets(code: string): Map<string, WebSocket> {
    let m = socketsByCode.get(code)
    if (!m) {
      m = new Map()
      socketsByCode.set(code, m)
    }
    return m
  }

  function broadcast(code: string, msg: ServerMessage, exceptPlayerId?: string): void {
    for (const [pid, sock] of roomSockets(code)) {
      if (pid === exceptPlayerId) continue
      send(sock, msg)
    }
  }

  app.get('/ws', { websocket: true }, (socket) => {
    let ctx: SocketCtx | null = null

    socket.on('message', async (raw: Buffer) => {
      let msg: ClientMessage
      try {
        msg = JSON.parse(raw.toString()) as ClientMessage
      } catch {
        send(socket, { t: 'error', code: 'bad_message', message: 'invalid JSON' })
        return
      }

      // First message must be the hello handshake.
      if (!ctx) {
        if (msg.t !== 'hello') {
          send(socket, { t: 'error', code: 'bad_message', message: 'expected hello' })
          socket.close()
          return
        }
        const resolved = await auth.resolve(msg.code, msg.rejoinToken)
        if (!resolved) {
          send(socket, { t: 'error', code: 'bad_token', message: 'invalid room or token' })
          socket.close()
          return
        }
        const code = msg.code.toUpperCase()
        const hub = registry.getOrCreate(code)
        hub.addMember({
          id: resolved.player.id,
          name: resolved.player.name,
          role: resolved.player.role,
          isHost: resolved.player.isHost,
        })
        ctx = { playerId: resolved.player.id, code, hub, alive: true }
        roomSockets(code).set(resolved.player.id, socket)

        send(socket, {
          t: 'welcome',
          you: resolved.player,
          players: hub.publicMembers(),
          phase: hub.getPhase(),
          zone: hub.getZone(),
        })
        broadcast(code, { t: 'player.joined', player: resolved.player }, resolved.player.id)
        return
      }

      // Authenticated message handling.
      handleMessage(ctx, socket, msg, broadcast)
    })

    socket.on('pong', () => {
      if (ctx) ctx.alive = true
    })

    socket.on('close', () => {
      if (!ctx) return
      const { code, playerId, hub } = ctx
      roomSockets(code).delete(playerId)
      hub.removeMember(playerId)
      broadcast(code, { t: 'player.left', playerId })
      registry.disposeIfEmpty(code)
      if (roomSockets(code).size === 0) socketsByCode.delete(code)
    })
  })

  // Position broadcast tick: coalesced latest-per-player, withholding applied
  // per-viewer by the RoomHub.
  const batchTimer = setInterval(() => {
    for (const [code, sockets] of socketsByCode) {
      const hub = registry.get(code)
      if (!hub) continue
      for (const [pid, sock] of sockets) {
        const positions = hub.positionBatchFor(pid)
        if (positions.length > 0) send(sock, { t: 'pos.batch', positions })
      }
    }
  }, batchIntervalMs)
  batchTimer.unref?.()

  // Heartbeat: ping all sockets; mark presence on pong.
  const heartbeatTimer = setInterval(() => {
    for (const sockets of socketsByCode.values()) {
      for (const sock of sockets.values()) {
        try {
          sock.ping()
        } catch {
          // ignore
        }
      }
    }
  }, heartbeatMs)
  heartbeatTimer.unref?.()

  app.addHook('onClose', async () => {
    clearInterval(batchTimer)
    clearInterval(heartbeatTimer)
  })
}

/** Handle an authenticated (post-hello) client message. */
function handleMessage(
  ctx: SocketCtx,
  socket: WebSocket,
  msg: ClientMessage,
  broadcast: (code: string, msg: ServerMessage, exceptPlayerId?: string) => void,
): void {
  const { hub, code, playerId } = ctx
  switch (msg.t) {
    case 'pos': {
      const breached = hub.updatePosition(playerId, msg.pos)
      if (breached) broadcast(code, { t: 'zone.breach', playerId })
      break
    }
    case 'zone.set': {
      hub.setZone(msg.zone)
      // Seekers only ever see the declared zone — broadcasting the zone itself
      // is safe (it's the public boundary, not the hider's exact position).
      broadcast(code, { t: 'zone', zone: msg.zone })
      break
    }
    case 'ruledout.add': {
      hub.addRuledOutCells(msg.cells)
      broadcast(code, { t: 'ruledout', cells: hub.ruledOutCells() })
      break
    }
    case 'host.action': {
      // Host-authoritative phase transition (MULTI-003b-1). Non-host actions
      // and unknown actions are ignored by the hub.
      const phase = hub.applyHostAction(playerId, msg.action)
      if (phase) broadcast(code, { t: 'phase', phase })
      break
    }
    case 'game.event': {
      // Relay question/curse events to everyone else, tagged with the sender so
      // clients can suppress their own echo (MULTI-003b-2).
      broadcast(
        code,
        { t: 'game.event', kind: msg.kind, from: playerId, payload: msg.payload },
        playerId,
      )
      break
    }
    case 'hello':
      // Already authenticated — ignore a duplicate hello.
      break
    default: {
      send(socket, { t: 'error', code: 'bad_message', message: 'unknown message' })
    }
  }
}
