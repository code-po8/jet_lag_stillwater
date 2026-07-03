import type { SyncedState } from '@jet-lag-stillwater/shared'
import { DEFAULT_CODE_LENGTH, generateCode } from './code.js'
import { generateRejoinToken, verifyToken } from './token.js'
import { initialExpiry } from './ttl.js'

/** Subset of a pg pool/client the repository needs (keeps it testable). */
export interface Queryable {
  query<R = Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: R[]; rowCount: number | null }>
}

export interface SessionRow {
  id: string
  code: string
  phase: string
  status: string
  state: SyncedState | Record<string, never>
  state_version: number
  created_at: string
  expires_at: string
}

export interface PlayerRow {
  id: string
  session_id: string
  name: string
  role: string
  is_host: boolean
  connected: boolean
  joined_at: string
}

export interface CreateRoomResult {
  session: SessionRow
  player: PlayerRow
  /** Raw host rejoin token — returned to the client once. */
  rejoinToken: string
}

export interface JoinRoomResult {
  player: PlayerRow
  rejoinToken: string
}

/** Postgres unique-violation error code. */
const UNIQUE_VIOLATION = '23505'
const MAX_CODE_ATTEMPTS = 8

/**
 * Create a room (session) plus its host player. Retries on code collision
 * (the partial unique index rejects an in-use active code) and bumps the code
 * length after repeated collisions.
 */
export async function createRoom(
  db: Queryable,
  opts: { hostName: string; now?: Date },
): Promise<CreateRoomResult> {
  const now = opts.now ?? new Date()
  const expiresAt = initialExpiry(now)
  let length = DEFAULT_CODE_LENGTH

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = generateCode(length)
    try {
      const { rows } = await db.query<SessionRow>(
        `INSERT INTO sessions (code, expires_at) VALUES ($1, $2) RETURNING *`,
        [code, expiresAt.toISOString()],
      )
      const session = rows[0]!
      const { raw, hash } = generateRejoinToken()
      const { rows: pRows } = await db.query<PlayerRow>(
        // Host starts as a seeker — there is NO hider until the host explicitly
        // picks one in the lobby (Start is gated on that). See useMultiplayerBridge.
        `INSERT INTO players (session_id, name, role, is_host, rejoin_token_hash)
         VALUES ($1, $2, 'seeker', true, $3) RETURNING *`,
        [session.id, opts.hostName, hash],
      )
      return { session, player: pRows[0]!, rejoinToken: raw }
    } catch (err) {
      if (isUniqueViolation(err)) {
        // Collision — bump length every couple of attempts and retry.
        if (attempt >= 2) length++
        continue
      }
      throw err
    }
  }
  throw new Error('could not allocate a unique room code')
}

/** Fetch a non-ended room by code (case-insensitive). */
export async function getRoomByCode(db: Queryable, code: string): Promise<SessionRow | null> {
  const { rows } = await db.query<SessionRow>(
    `SELECT * FROM sessions WHERE code = $1 AND status <> 'ended' LIMIT 1`,
    [code.toUpperCase()],
  )
  return rows[0] ?? null
}

export async function listPlayers(db: Queryable, sessionId: string): Promise<PlayerRow[]> {
  const { rows } = await db.query<PlayerRow>(
    `SELECT * FROM players WHERE session_id = $1 ORDER BY joined_at ASC`,
    [sessionId],
  )
  return rows
}

/** Add a seeker to an existing room. */
export async function joinRoom(
  db: Queryable,
  opts: { code: string; name: string },
): Promise<JoinRoomResult | { error: 'not_found' }> {
  const session = await getRoomByCode(db, opts.code)
  if (!session) return { error: 'not_found' }

  const { raw, hash } = generateRejoinToken()
  const { rows } = await db.query<PlayerRow>(
    `INSERT INTO players (session_id, name, role, is_host, rejoin_token_hash)
     VALUES ($1, $2, 'seeker', false, $3) RETURNING *`,
    [session.id, opts.name, hash],
  )
  return { player: rows[0]!, rejoinToken: raw }
}

/** Re-attach an existing player using their rejoin token. */
export async function rejoinRoom(
  db: Queryable,
  opts: { code: string; rejoinToken: string },
): Promise<{ player: PlayerRow } | { error: 'not_found' | 'invalid_token' }> {
  const session = await getRoomByCode(db, opts.code)
  if (!session) return { error: 'not_found' }

  const { rows } = await db.query<PlayerRow & { rejoin_token_hash: string }>(
    `SELECT * FROM players WHERE session_id = $1`,
    [session.id],
  )
  const match = rows.find((p) => verifyToken(opts.rejoinToken, p.rejoin_token_hash))
  if (!match) return { error: 'invalid_token' }

  await db.query(`UPDATE players SET connected = true WHERE id = $1`, [match.id])
  return { player: match }
}

/**
 * Persist a single-hider role assignment for a room: the target player becomes
 * `hider`, everyone else in the session becomes `seeker`. Mirrors RoomHub.setHider
 * so a reconnecting client's role (read from the DB via auth.resolve) survives a
 * refresh or a server restart — without this the hider comes back as a seeker.
 */
export async function setHiderRole(
  db: Queryable,
  opts: { code: string; hiderId: string },
): Promise<void> {
  const session = await getRoomByCode(db, opts.code)
  if (!session) return
  // Two statements keyed by session_id keep it atomic-enough for a single-writer
  // (single-instance) API: demote all, then promote the chosen hider.
  await db.query(`UPDATE players SET role = 'seeker' WHERE session_id = $1`, [session.id])
  await db.query(`UPDATE players SET role = 'hider' WHERE session_id = $1 AND id = $2`, [
    session.id,
    opts.hiderId,
  ])
}

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === 'object' && err !== null && (err as { code?: string }).code === UNIQUE_VIOLATION
  )
}
