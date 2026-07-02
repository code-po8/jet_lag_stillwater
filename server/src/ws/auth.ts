import type { PublicPlayer } from '@jet-lag-stillwater/shared'
import { getRoomByCode, type Queryable } from '../rooms/repository.js'
import { verifyToken } from '../rooms/token.js'
import type { ConnectionAuth } from './gateway.js'

/**
 * DB-backed connection auth: resolves a (code, rejoinToken) pair to the player
 * by matching the token against the room's stored hashes. Returns null on any
 * mismatch so the gateway can reject the socket.
 */
export function dbConnectionAuth(db: Queryable): ConnectionAuth {
  return {
    async resolve(code: string, rejoinToken: string) {
      const session = await getRoomByCode(db, code)
      if (!session) return null

      const { rows } = await db.query<{
        id: string
        name: string
        role: string
        is_host: boolean
        connected: boolean
        rejoin_token_hash: string
      }>(`SELECT * FROM players WHERE session_id = $1`, [session.id])

      const match = rows.find((p) => verifyToken(rejoinToken, p.rejoin_token_hash))
      if (!match) return null

      const player: PublicPlayer = {
        id: match.id,
        name: match.name,
        role: match.role as PublicPlayer['role'],
        isHost: match.is_host,
        connected: true,
      }
      return { player }
    },
  }
}
