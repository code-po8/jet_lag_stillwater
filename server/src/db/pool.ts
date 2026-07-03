import pg from 'pg'

/**
 * Shared Postgres connection pool. Reads DATABASE_URL (injected by Railway and
 * set in docker-compose for local dev).
 */
let pool: pg.Pool | undefined

export function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set')
    }
    pool = new pg.Pool({ connectionString })
  }
  return pool
}

/** Close the pool (graceful shutdown / tests). */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = undefined
  }
}
