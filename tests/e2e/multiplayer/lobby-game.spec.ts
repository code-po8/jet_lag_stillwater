import { test, expect, type Page, type BrowserContext } from '@playwright/test'

/**
 * Full-stack 2-browser multiplayer E2E (opt-in via E2E_MULTIPLAYER=1).
 *
 * Drives the real path that unit tests can't: two independent browser contexts
 * (host + joiner) against a live WS server + Postgres. Covers the lobby→game
 * handoff, hider selection, host pause sync, and host end-game — the flow that
 * had bugs the unit suite couldn't catch.
 *
 * Requires the API server + Postgres running and the web built with
 * VITE_API_URL pointing at the API — playwright.config.ts wires this up when
 * E2E_MULTIPLAYER=1.
 */

async function createHost(
  context: BrowserContext,
  name: string,
): Promise<{ page: Page; code: string }> {
  const page = await context.newPage()
  await page.goto('/lobby')
  await page.getByTestId('host-name-input').fill(name)
  await page.getByTestId('create-room-btn').click()
  await expect(page.getByTestId('room-code-display')).toBeVisible()
  const code = (await page.getByTestId('room-code-display').textContent())?.trim() ?? ''
  expect(code).toMatch(/^[A-Z2-9]{4}$/)
  return { page, code }
}

/**
 * TEMP diagnostic (joiner misses set-hider roster on CI): capture every inbound
 * WS frame so we can see whether the `roster` message actually arrived.
 */
function captureWsFrames(page: Page): string[] {
  const frames: string[] = []
  page.on('websocket', (ws) => {
    ws.on('framereceived', (f) => {
      if (typeof f.payload === 'string') frames.push(f.payload)
    })
  })
  return frames
}

async function joinRoom(
  context: BrowserContext,
  code: string,
  name: string,
): Promise<{ page: Page; frames: string[] }> {
  const page = await context.newPage()
  const frames = captureWsFrames(page) // attach before the WS opens
  await page.goto('/lobby')
  await page.getByTestId('join-code-input').fill(code)
  await page.getByTestId('join-name-input').fill(name)
  await page.getByTestId('join-submit-btn').click()
  await expect(page.getByTestId('room-code-display')).toHaveText(code)
  return { page, frames }
}

test.describe('multiplayer lobby → game (2 browsers)', () => {
  test('host sees joiner, picks hider, starts; both play; pause + end sync', async ({
    browser,
  }) => {
    const hostCtx = await browser.newContext()
    const joinCtx = await browser.newContext()

    // 1. Host creates a room; joiner joins with the code.
    const { page: host, code } = await createHost(hostCtx, 'Hank')
    const { page: joiner, frames: joinerFrames } = await joinRoom(joinCtx, code, 'Sam')

    // 2. Host sees the joiner appear in the live roster (WS player.joined).
    await expect(host.getByTestId('lobby-roster')).toContainText('Sam')
    // Start is gated until a hider is chosen.
    await expect(host.getByTestId('start-game-btn')).toBeDisabled()

    // 3. Host picks the joiner as the hider (roster re-broadcast to both).
    await host.getByTestId('lobby-roster').getByRole('button', { name: 'Sam' }).click()
    await expect(host.getByTestId('start-game-btn')).toBeEnabled()

    // Wait until the JOINER has received the roster update (their own row shows
    // the HIDER badge) before starting — otherwise starting can race the role
    // broadcast and the joiner would enter the game still shown as a seeker.
    try {
      await expect(joiner.getByTestId('lobby-roster')).toContainText('HIDER')
    } catch (e) {
      // Diagnostic: what did the joiner's socket actually receive?
      console.log('=== JOINER WS FRAMES (received) ===')
      for (const f of joinerFrames) console.log(f)
      console.log('=== JOINER lobby roster DOM ===')
      console.log(await joiner.getByTestId('lobby-roster').textContent())
      throw e
    }

    // 4. Host starts — BOTH clients navigate to the game (bridge-driven nav).
    await host.getByTestId('start-game-btn').click()
    await expect(host).toHaveURL(/\/game/)
    await expect(joiner).toHaveURL(/\/game/)

    // 5. Roles/names propagated: host is a seeker, joiner (Sam) is the hider.
    await expect(host.getByTestId('current-role-display')).toContainText(/seeker/i)
    await expect(joiner.getByTestId('current-role-display')).toContainText(/hider/i)

    // 6. Host pauses → the joiner sees the paused overlay (host-authoritative).
    // Move into a pausable phase first (start-hiding already did).
    await host.getByLabel('Pause game').click()
    await expect(joiner.getByTestId('game-pause-overlay')).toBeVisible()
    // Non-host cannot resume — only a waiting message.
    await expect(joiner.getByTestId('pause-waiting')).toBeVisible()

    // 7. Host resumes → the joiner's overlay clears.
    await host.getByLabel('Resume game').click()
    await expect(joiner.getByTestId('game-pause-overlay')).toBeHidden()

    // 8. Host ends the game early → both clients leave the game.
    await host.getByTestId('end-game-btn').click()
    await expect(host).toHaveURL(/\/results/)
    await expect(joiner).toHaveURL(/\/results/)

    await hostCtx.close()
    await joinCtx.close()
  })
})
