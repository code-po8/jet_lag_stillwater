import { execSync } from 'node:child_process'

/**
 * Multiplayer E2E global setup: build the shared package before Playwright
 * starts the API server. The server imports @jet-lag-stillwater/shared as a real
 * package (file:../shared → shared/dist), so shared/dist must exist first —
 * otherwise `tsx` fails to resolve the module at server boot.
 */
export default function globalSetup(): void {
  execSync('npm --prefix shared run build', { stdio: 'inherit' })
}
