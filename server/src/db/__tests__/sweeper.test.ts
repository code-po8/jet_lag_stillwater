import { describe, it, expect, vi } from 'vitest'
import { sweepExpiredSessions, startExpirySweeper } from '../sweeper.js'

/** Minimal queryable stub matching the subset of pg.Pool the sweeper uses. */
function makeQueryable(rowCount: number) {
  return {
    query: vi.fn().mockResolvedValue({ rowCount }),
  }
}

describe('sweepExpiredSessions', () => {
  it('deletes sessions whose expires_at has passed', async () => {
    const db = makeQueryable(3)
    const deleted = await sweepExpiredSessions(db)

    expect(deleted).toBe(3)
    expect(db.query).toHaveBeenCalledTimes(1)
    const sql = db.query.mock.calls[0][0] as string
    expect(sql.toLowerCase()).toContain('delete from sessions')
    expect(sql.toLowerCase()).toContain('expires_at')
  })

  it('returns 0 when nothing is expired', async () => {
    const db = makeQueryable(0)
    expect(await sweepExpiredSessions(db)).toBe(0)
  })

  it('treats a null rowCount as 0', async () => {
    const db = { query: vi.fn().mockResolvedValue({ rowCount: null }) }
    expect(await sweepExpiredSessions(db)).toBe(0)
  })
})

describe('startExpirySweeper', () => {
  it('runs a sweep immediately and returns a stop handle', async () => {
    const db = makeQueryable(0)
    const handle = startExpirySweeper(db, { intervalMs: 60_000 })
    // immediate first sweep
    await Promise.resolve()
    expect(db.query).toHaveBeenCalled()
    expect(typeof handle.stop).toBe('function')
    handle.stop()
  })

  it('stop() clears the interval (no throw)', () => {
    const db = makeQueryable(0)
    const handle = startExpirySweeper(db, { intervalMs: 60_000 })
    expect(() => handle.stop()).not.toThrow()
  })
})
