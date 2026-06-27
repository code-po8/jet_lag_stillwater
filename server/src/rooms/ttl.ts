/**
 * Room TTL policy (INFRA-005 / MULTI-001 design):
 *   - created at  now + 2 days
 *   - slid forward to now + 2 days on activity (persist-while-paused)
 *   - dropped to  now + 1 hour when the round ends (expire shortly after)
 *
 * Functions take an explicit `now` so they are deterministic and testable.
 */

export const ACTIVE_TTL_MS = 2 * 24 * 60 * 60 * 1000 // 2 days
export const ENDED_TTL_MS = 60 * 60 * 1000 // 1 hour

export function initialExpiry(now: Date): Date {
  return new Date(now.getTime() + ACTIVE_TTL_MS)
}

/** New expiry when there's room activity (same as initial: now + 2 days). */
export function slidExpiry(now: Date): Date {
  return new Date(now.getTime() + ACTIVE_TTL_MS)
}

/** Shortened expiry once the round ends: now + 1 hour. */
export function endedExpiry(now: Date): Date {
  return new Date(now.getTime() + ENDED_TTL_MS)
}
