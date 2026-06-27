import { randomBytes, createHash, timingSafeEqual } from 'node:crypto'

/**
 * Rejoin tokens let a dropped device reclaim its player slot. The RAW token is
 * returned to the client exactly once; only its SHA-256 hash is stored, so a
 * database leak does not expose usable tokens. Tokens are room-scoped and die
 * with the room.
 */

const TOKEN_BYTES = 32

export interface RejoinToken {
  /** Raw token — returned to the client once, never persisted. */
  raw: string
  /** SHA-256 hex hash — the only form stored in the DB. */
  hash: string
}

export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

export function generateRejoinToken(): RejoinToken {
  const raw = randomBytes(TOKEN_BYTES).toString('hex')
  return { raw, hash: hashToken(raw) }
}

/** Constant-time comparison of a presented raw token against a stored hash. */
export function verifyToken(raw: string, storedHash: string): boolean {
  if (!storedHash) return false
  const presented = Buffer.from(hashToken(raw), 'hex')
  const stored = Buffer.from(storedHash, 'hex')
  if (presented.length !== stored.length) return false
  return timingSafeEqual(presented, stored)
}
