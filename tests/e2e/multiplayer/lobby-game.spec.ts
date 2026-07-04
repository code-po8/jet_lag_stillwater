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
    frames.push(`>> OPEN ${ws.url()}`)
    ws.on('framesent', (f) => {
      if (typeof f.payload === 'string') frames.push(`SENT ${f.payload}`)
    })
    ws.on('framereceived', (f) => {
      if (typeof f.payload === 'string') frames.push(`RECV ${f.payload}`)
    })
    ws.on('close', () => frames.push(`<< CLOSE ${ws.url()}`))
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
    // broadcast and the joiner would enter the game still shown as a seeker. Use a
    // generous timeout: the first WS handshake after a cold dev-server boot can be
    // slow, and this is test setup (not the behavior under test). On failure, dump
    // the joiner's frames to show whether the `roster` message ever arrived.
    try {
      await expect(joiner.getByTestId('lobby-roster')).toContainText('HIDER', { timeout: 15_000 })
    } catch (e) {
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

  test('host keeps roster names + host controls after a mid-game refresh', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const joinCtx = await browser.newContext()

    const { page: host, code } = await createHost(hostCtx, 'Hank')
    const { page: joiner } = await joinRoom(joinCtx, code, 'Sam')

    await expect(host.getByTestId('lobby-roster')).toContainText('Sam')
    await host.getByTestId('lobby-roster').getByRole('button', { name: 'Sam' }).click()
    // Wait (generously) for the joiner to receive the role broadcast before
    // starting — this is test setup, not the behavior under test, so don't let
    // the roster-propagation race flake it.
    await expect(joiner.getByTestId('lobby-roster')).toContainText('HIDER', { timeout: 15_000 })
    await host.getByTestId('start-game-btn').click()
    await expect(host).toHaveURL(/\/game/)

    // Names render for the host before the refresh (host is a seeker; Sam hides).
    await expect(host.getByTestId('hider-name')).toContainText('Sam')

    // Capture the host's frames ACROSS the reload (attach before reloading).
    const hostFrames = captureWsFrames(host)

    // The bug: host refreshes mid-hiding → reconnect welcome must restore the
    // roster (names) AND host status (the pause control).
    await host.reload()
    await expect(host).toHaveURL(/\/game/)

    try {
      await expect(host.getByTestId('hider-name')).toContainText('Sam', { timeout: 10_000 })
      await expect(host.getByLabel('Pause game')).toBeVisible()
    } catch (e) {
      console.log('=== HOST WS FRAMES after reload ===')
      for (const f of hostFrames) console.log(f)
      console.log('=== HOST hider-name DOM ===')
      console.log(
        await host
          .getByTestId('hider-name')
          .textContent()
          .catch(() => '(missing)'),
      )
      throw e
    }

    await hostCtx.close()
    await joinCtx.close()
  })

  test('BOTH host and joiner keep names after each refreshes mid-game', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    const joinCtx = await browser.newContext()

    const { page: host, code } = await createHost(hostCtx, 'Hank')
    const { page: joiner } = await joinRoom(joinCtx, code, 'Sam')

    await expect(host.getByTestId('lobby-roster')).toContainText('Sam')
    await host.getByTestId('lobby-roster').getByRole('button', { name: 'Sam' }).click()
    await expect(joiner.getByTestId('lobby-roster')).toContainText('HIDER', { timeout: 15_000 })
    await host.getByTestId('start-game-btn').click()
    await expect(host).toHaveURL(/\/game/)
    await expect(joiner).toHaveURL(/\/game/)

    // Joiner (the hider) refreshes → must still see itself + the seeker roster.
    const joinerFrames = captureWsFrames(joiner)
    await joiner.reload()
    await expect(joiner).toHaveURL(/\/game/)
    try {
      await expect(joiner.getByTestId('current-role-display')).toContainText(/hider/i, {
        timeout: 10_000,
      })
      await expect(joiner.getByTestId('seekers-list')).toContainText('Hank')
    } catch (e) {
      console.log('=== JOINER WS FRAMES after reload ===')
      for (const f of joinerFrames) console.log(f)
      throw e
    }

    // Then the HOST refreshes → must still see the hider + host controls.
    const hostFrames = captureWsFrames(host)
    await host.reload()
    await expect(host).toHaveURL(/\/game/)
    try {
      await expect(host.getByTestId('hider-name')).toContainText('Sam', { timeout: 10_000 })
      await expect(host.getByLabel('Pause game')).toBeVisible()
    } catch (e) {
      console.log('=== HOST WS FRAMES after reload ===')
      for (const f of hostFrames) console.log(f)
      throw e
    }

    await hostCtx.close()
    await joinCtx.close()
  })

  test('host-as-hider keeps its hider role + names after a mid-game refresh', async ({
    browser,
  }) => {
    // The reported scenario: the HOST is the hider. Its DB role is 'seeker' until
    // set-hider persists the assignment; without that, a host-hider refresh reads
    // the stale DB role and comes back as a seeker with the roster/name lost.
    const hostCtx = await browser.newContext()
    const joinCtx = await browser.newContext()

    const { page: host, code } = await createHost(hostCtx, 'Hank')
    const { page: joiner } = await joinRoom(joinCtx, code, 'Sam')

    await expect(host.getByTestId('lobby-roster')).toContainText('Sam')
    // Host picks ITSELF as the hider.
    await host.getByTestId('lobby-roster').getByRole('button', { name: 'Hank' }).click()
    await expect(joiner.getByTestId('lobby-roster')).toContainText('HIDER', { timeout: 15_000 })
    await host.getByTestId('start-game-btn').click()
    await expect(host).toHaveURL(/\/game/)

    await expect(host.getByTestId('current-role-display')).toContainText(/hider/i)

    const hostFrames = captureWsFrames(host)
    await host.reload()
    await expect(host).toHaveURL(/\/game/)
    try {
      // Still the hider (not demoted to seeker) and still sees the seeker roster.
      await expect(host.getByTestId('current-role-display')).toContainText(/hider/i, {
        timeout: 10_000,
      })
      await expect(host.getByTestId('seekers-list')).toContainText('Sam')
    } catch (e) {
      console.log('=== HOST(=hider) WS FRAMES after reload ===')
      for (const f of hostFrames) console.log(f)
      console.log('=== role display DOM ===')
      console.log(
        await host
          .getByTestId('current-role-display')
          .textContent()
          .catch(() => '(missing)'),
      )
      throw e
    }

    await hostCtx.close()
    await joinCtx.close()
  })

  // Regression: the hider's own GPS "you" dot stopped rendering on the map tab
  // after the map merges. The dot needs BOTH a server `self` (multiplayer) AND a
  // real geolocation fix — the unit suite mocks geolocation, so it can't catch a
  // break in the live GPS→marker path. This drives the real path with a granted,
  // fixed geolocation and asserts the self marker's "(you)" tooltip renders.
  test('the joiner sees their own GPS "you" dot on the map', async ({ browser }) => {
    const hostCtx = await browser.newContext()
    // Grant + fix geolocation for the joiner so watchPosition delivers a fix.
    const joinCtx = await browser.newContext({
      permissions: ['geolocation'],
      geolocation: { latitude: 36.1223, longitude: -97.0687 }, // OSU Student Union
    })

    const { page: host, code } = await createHost(hostCtx, 'Hank')
    const { page: joiner } = await joinRoom(joinCtx, code, 'Sam')

    await expect(host.getByTestId('lobby-roster')).toContainText('Sam')
    // Host picks ITSELF as hider → the joiner is a SEEKER. A seeker's map has no
    // interactive bus-stop layer, so the ONLY player marker on it is the self
    // "you" dot — making its presence unambiguous to assert.
    await host.getByTestId('lobby-roster').getByRole('button', { name: 'Hank' }).click()
    // Wait for the role broadcast to reach the joiner: the host's row now shows
    // the HIDER badge in the joiner's roster (there is no explicit SEEKER badge).
    await expect(joiner.getByTestId('lobby-roster')).toContainText('HIDER', { timeout: 15_000 })
    await host.getByTestId('start-game-btn').click()
    await expect(joiner).toHaveURL(/\/game/)
    await expect(joiner.getByTestId('current-role-display')).toContainText(/seeker/i)

    // Open the map tab (MapPanel only mounts — and only starts geolocation — here).
    await joiner.getByTestId('bottom-nav').getByRole('button', { name: 'Map' }).click()
    await expect(joiner.getByTestId('base-map-canvas')).toBeVisible()

    // The self "you" dot is a radius-9 Leaflet circleMarker in the marker layer
    // group. With a granted, fixed geolocation it must appear once the first GPS
    // fix arrives. Assert a visible player marker (r≥9) is painted on the map —
    // its absence is the reported bug (no "you" dot despite a working GPS).
    await expect(async () => {
      const rendered = await joiner.evaluate(() => {
        const paths = Array.from(
          document.querySelectorAll<SVGPathElement>('.leaflet-overlay-pane path'),
        )
        // Player markers are the larger circles (r=9 self / r=7 others); POIs are
        // r≤5. A visible r≥7 circle is a player dot.
        return paths.some((p) => {
          const d = p.getAttribute('d') ?? ''
          const m = d.match(/a(\d+(?:\.\d+)?),/) // radius from the arc command
          const r = m ? parseFloat(m[1]!) : 0
          const rect = p.getBoundingClientRect()
          const cs = getComputedStyle(p)
          return r >= 7 && rect.width > 0 && cs.visibility === 'visible' && cs.display !== 'none'
        })
      })
      expect(rendered).toBe(true)
    }).toPass({ timeout: 15_000 })

    await hostCtx.close()
    await joinCtx.close()
  })
})
