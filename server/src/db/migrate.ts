/**
 * Programmatic database migrations (INFRA-007 / deploy).
 *
 * Applies the SQL migrations in `server/migrations` on demand, using
 * node-pg-migrate's runner API rather than shelling out to its CLI — so the
 * production image needs neither the CLI binary on PATH nor a shell step, just
 * the (prod) dependency. server.ts calls this on boot when DATABASE_URL is set,
 * making deploys hands-off: a fresh Railway Postgres is migrated automatically.
 *
 * Idempotent: node-pg-migrate records applied migrations in `pgmigrations`, so
 * re-running (every boot, every replica restart) only applies what's pending.
 */
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import migrationRunner from 'node-pg-migrate'

// `migrations/` sits at the server package root in both layouts:
//   dev:  server/src/db/migrate.ts   -> ../../migrations = server/migrations
//   prod: /app/dist/db/migrate.js    -> ../../migrations = /app/migrations
// (the Dockerfile copies migrations/ next to dist/).
const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../migrations',
)

export interface RunMigrationsOptions {
  databaseUrl: string
  /** Migration direction; only 'up' is used on boot. */
  direction?: 'up' | 'down'
  /** node-pg-migrate log sink (defaults to console). */
  logger?: { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void }
}

/**
 * Apply all pending migrations. Resolves with the list of migrations that ran
 * (empty when the schema is already current). Rejects on failure so the caller
 * can decide whether to abort startup.
 */
export async function runMigrations(options: RunMigrationsOptions): Promise<{ name: string }[]> {
  const applied = await migrationRunner({
    databaseUrl: options.databaseUrl,
    dir: MIGRATIONS_DIR,
    migrationsTable: 'pgmigrations',
    direction: options.direction ?? 'up',
    count: Infinity,
    // SQL-only migrations (mirrors `-j sql` in the package scripts).
    ignorePattern: '.*\\.(?!sql$).*',
    logger: options.logger,
  })
  return applied.map((m) => ({ name: m.name }))
}
