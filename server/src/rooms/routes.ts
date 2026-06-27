import type { FastifyInstance, FastifyPluginOptions } from 'fastify'
import { isValidCode } from './code.js'
import {
  createRoom,
  getRoomByCode,
  joinRoom,
  listPlayers,
  rejoinRoom,
  type Queryable,
} from './repository.js'

export interface RoomRoutesOptions extends FastifyPluginOptions {
  db: Queryable
}

/** Shape returned for a player to the client (never includes the token hash). */
function publicPlayer(p: {
  id: string
  name: string
  role: string
  is_host: boolean
  connected: boolean
}) {
  // `connected` is part of the PublicPlayer DTO; omitting it left REST-sourced
  // rosters with connected===undefined (rendered as disconnected) until a WS
  // presence event arrived.
  return { id: p.id, name: p.name, role: p.role, isHost: p.is_host, connected: p.connected }
}

/**
 * REST control-plane for rooms (INFRA-005). The data-plane (positions, state
 * sync) is the WebSocket gateway in INFRA-006.
 */
export async function roomRoutes(app: FastifyInstance, opts: RoomRoutesOptions): Promise<void> {
  const db = opts.db

  // Create a room. Returns the code + the host's one-time rejoin token.
  app.post<{ Body: { name?: string } }>('/rooms', async (req, reply) => {
    const name = req.body?.name?.trim()
    if (!name) return reply.code(400).send({ error: 'name is required' })

    const { session, player, rejoinToken } = await createRoom(db, { hostName: name })
    return reply.code(201).send({
      code: session.code,
      sessionId: session.id,
      player: publicPlayer(player),
      rejoinToken,
    })
  })

  // Lobby probe: room + current roster.
  app.get<{ Params: { code: string } }>('/rooms/:code', async (req, reply) => {
    const { code } = req.params
    if (!isValidCode(code, { caseInsensitive: true })) {
      return reply.code(400).send({ error: 'invalid code' })
    }
    const session = await getRoomByCode(db, code)
    if (!session) return reply.code(404).send({ error: 'room not found' })

    const players = await listPlayers(db, session.id)
    return reply.send({
      code: session.code,
      phase: session.phase,
      status: session.status,
      players: players.map(publicPlayer),
    })
  })

  // Join with a code + name. Returns the player's one-time rejoin token.
  app.post<{ Params: { code: string }; Body: { name?: string } }>(
    '/rooms/:code/join',
    async (req, reply) => {
      const { code } = req.params
      const name = req.body?.name?.trim()
      if (!isValidCode(code, { caseInsensitive: true })) {
        return reply.code(400).send({ error: 'invalid code' })
      }
      if (!name) return reply.code(400).send({ error: 'name is required' })

      const result = await joinRoom(db, { code, name })
      if ('error' in result) return reply.code(404).send({ error: 'room not found' })

      return reply.code(201).send({
        player: publicPlayer(result.player),
        rejoinToken: result.rejoinToken,
      })
    },
  )

  // Rejoin with a previously issued rejoin token.
  app.post<{ Params: { code: string }; Body: { rejoinToken?: string } }>(
    '/rooms/:code/rejoin',
    async (req, reply) => {
      const { code } = req.params
      const token = req.body?.rejoinToken
      if (!isValidCode(code, { caseInsensitive: true })) {
        return reply.code(400).send({ error: 'invalid code' })
      }
      if (!token) return reply.code(400).send({ error: 'rejoinToken is required' })

      const result = await rejoinRoom(db, { code, rejoinToken: token })
      if ('error' in result) {
        if (result.error === 'not_found') {
          return reply.code(404).send({ error: 'room not found' })
        }
        return reply.code(401).send({ error: 'invalid rejoin token' })
      }
      return reply.send({ player: publicPlayer(result.player) })
    },
  )
}
