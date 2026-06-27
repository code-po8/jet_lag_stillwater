import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      // server/ has its own vitest (Node env, own deps) — don't let the
      // frontend runner pick up its tests. shared/ tests run here fine.
      exclude: [...configDefaults.exclude, 'e2e/**', 'tests/e2e/**', 'server/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      setupFiles: ['./src/test-setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        reportsDirectory: './coverage',
        include: ['src/**/*.{ts,vue}'],
        exclude: ['src/**/__tests__/**', 'src/**/*.d.ts', 'src/test-setup.ts'],
      },
    },
  }),
)
