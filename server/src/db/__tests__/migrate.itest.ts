import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import pg from 'pg'
import { runMigrations } from '../migrate.js'

// Integration test for the programmatic migration runner (auto-migrate on boot).
// Runs only under the `itest-server` compose service (DATABASE_URL + a real DB).
const DATABASE_URL = process.env.DATABASE_URL
const d = DATABASE_URL ? describe : describe.skip

d('runMigrations (integration)', () => {
  let pool: pg.Pool

  beforeAll(() => {
    pool = new pg.Pool({ connectionString: DATABASE_URL })
  })
  afterAll(async () => {
    await pool.end()
  })

  it('applies the schema and is idempotent on a second run', async () => {
    // Start from a clean slate so the first run actually applies something.
    await pool.query('DROP TABLE IF EXISTS players, sessions, pgmigrations CASCADE')

    const firstRun = await runMigrations({ databaseUrl: DATABASE_URL! })
    expect(firstRun.length).toBeGreaterThan(0)

    // The expected tables now exist.
    const tables = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
    )
    const names = tables.rows.map((r) => r.table_name)
    expect(names).toContain('sessions')
    expect(names).toContain('players')

    // A second run applies nothing (idempotent — safe to run every boot/replica).
    const secondRun = await runMigrations({ databaseUrl: DATABASE_URL! })
    expect(secondRun).toEqual([])
  })
})
