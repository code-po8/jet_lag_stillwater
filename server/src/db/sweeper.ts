/**
 * Expiry sweeper (INFRA-004): periodically evicts rooms whose TTL has passed.
 *
 * Sessions carry an `expires_at` that is created at now+2 days, slid forward on
 * activity (persist-while-paused), and dropped to now+1h on round end. This
 * sweeper deletes whatever is already past its expiry; ON DELETE CASCADE drops
 * the room's players too.
 */

/** The subset of a pg pool/client the sweeper needs (keeps it unit-testable). */
export interface Queryable {
  query(text: string, params?: unknown[]): Promise<{ rowCount: number | null }>
}

const DELETE_EXPIRED_SQL = 'DELETE FROM sessions WHERE expires_at <= now()'

/** Run one sweep. Returns how many sessions were deleted. */
export async function sweepExpiredSessions(db: Queryable): Promise<number> {
  const result = await db.query(DELETE_EXPIRED_SQL)
  return result.rowCount ?? 0
}

export interface SweeperOptions {
  /** How often to sweep, in milliseconds. */
  intervalMs?: number
  /** Called with the count after each sweep (logging hook). */
  onSweep?: (deleted: number) => void
  /** Called if a sweep throws (logging hook). */
  onError?: (err: unknown) => void
}

export interface SweeperHandle {
  stop: () => void
}

/**
 * Start the periodic sweeper. Runs one sweep immediately, then every
 * `intervalMs`. Returns a handle whose `stop()` clears the timer.
 */
export function startExpirySweeper(db: Queryable, options: SweeperOptions = {}): SweeperHandle {
  const intervalMs = options.intervalMs ?? 5 * 60 * 1000 // default: every 5 min

  const runSweep = () => {
    sweepExpiredSessions(db)
      .then((deleted) => options.onSweep?.(deleted))
      .catch((err) => options.onError?.(err))
  }

  runSweep() // immediate first pass
  const timer = setInterval(runSweep, intervalMs)
  // Don't keep the process alive solely for the sweeper.
  if (typeof timer.unref === 'function') {
    timer.unref()
  }

  return {
    stop: () => clearInterval(timer),
  }
}
