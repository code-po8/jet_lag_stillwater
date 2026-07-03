import { defineConfig, devices } from '@playwright/test'

/**
 * Multiplayer E2E needs the full stack (WS server + Postgres), which is heavier
 * to stand up than the offline specs. It's opt-in via E2E_MULTIPLAYER=1 so the
 * default `npm run test:e2e` stays fast (offline specs only). CI sets the flag
 * for a dedicated job that provisions Postgres + the API server.
 */
const MULTIPLAYER = process.env.E2E_MULTIPLAYER === '1'
/** API/WS server URL the web client is built to talk to during multiplayer E2E. */
const API_URL = process.env.VITE_API_URL ?? 'http://localhost:3000'

/**
 * Playwright configuration for E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Directory for test files
  testDir: './tests/e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use - HTML report for local, line for CI
  reporter: [['html', { open: 'never' }], ['list']],

  // Shared settings for all the projects below
  use: {
    // Base URL for the dev server
    baseURL: 'http://localhost:5173',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Take screenshot on failure
    screenshot: 'only-on-failure',
  },

  // Configure projects for major browsers. The multiplayer project runs only
  // the full-stack specs (and only when E2E_MULTIPLAYER=1); the offline
  // projects explicitly exclude that directory.
  projects: MULTIPLAYER
    ? [
        {
          name: 'multiplayer',
          testMatch: /multiplayer\/.*\.spec\.ts/,
          use: { ...devices['Desktop Chrome'] },
        },
      ]
    : [
        {
          name: 'chromium',
          testIgnore: /multiplayer\//,
          use: { ...devices['Desktop Chrome'] },
        },
        // Mobile viewport for testing responsive design
        {
          name: 'mobile-chrome',
          testIgnore: /multiplayer\//,
          use: { ...devices['Pixel 5'] },
        },
      ],

  // Start the web dev server; for multiplayer also start the API server (which
  // auto-migrates its Postgres on boot) and point the web client at it.
  webServer: MULTIPLAYER
    ? [
        {
          // The API server imports @jet-lag-stillwater/shared as a real package
          // (file:../shared → shared/dist), resolved at runtime — so shared MUST
          // be built before the server process boots. Build it in THIS command
          // (sequential &&) rather than globalSetup, which races the webServer
          // startup. --force (in the shared build script) defeats stale
          // incremental buildinfo skipping emit. DATABASE_URL is from the env.
          command: 'npm --prefix shared run build && npm --prefix server run dev',
          url: `${API_URL}/health`,
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
        {
          // Linux/CI shell; VITE_API_URL is read by the Vite client at load.
          command: `VITE_API_URL=${API_URL} npm run dev`,
          url: 'http://localhost:5173',
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
      ]
    : {
        command: 'npm run dev',
        url: 'http://localhost:5173',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000, // 2 minutes to start dev server
      },
})
