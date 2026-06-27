import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Integration tests (*.itest.ts) — require a real Postgres via DATABASE_URL.
// Run in the `itest-server` compose service, separate from the offline unit run.
export default defineConfig({
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('../shared/src/index.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.itest.ts'],
    // DB-backed tests share tables; run files sequentially to avoid races.
    fileParallelism: false,
  },
})
