import { test, expect, type Page, type BrowserContext } from '@playwright/test'

/**
 * Full-stack 2-browser multiplayer E2E for the question-sync + shading epic
 * (opt-in via E2E_MULTIPLAYER=1). Drives the REAL cross-client path that the
 * unit suite mocks: a question asked on one browser reaching another over the
 * live WS server + Postgres.
 *
 * Covered:
 *  - QSYNC-004: a seeker asks a question → the hider's device shows it.
 *  - QSYNC-006: the hider is alerted on ANY tab (prompt + Cards nav badge).
 *  - MAP-009:   the hider's map shows the seeker's ask-time pin.
 *  - QSYNC-005: the hider answers in-app → the seeker's device records it.
 *
 * These are exactly the behaviors the project notes only a 2-browser E2E can
 * catch (the unit tests mock the transport). See CLAUDE.md.
 */

// A real radar question id + its visible text (from the seeded question data).
const RADAR_QUESTION_ID = 'radar-0.5-miles'
// A real thermometer question id (issue #29: seeker sends a travel vector).
const THERMOMETER_QUESTION_ID = 'thermometer-0.5-miles'

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

async function joinRoom(context: BrowserContext, code: string, name: string): Promise<Page> {
  const page = await context.newPage()
  await page.goto('/lobby')
  await page.getByTestId('join-code-input').fill(code)
  await page.getByTestId('join-name-input').fill(name)
  await page.getByTestId('join-submit-btn').click()
  await expect(page.getByTestId('room-code-display')).toHaveText(code)
  return page
}

test.describe('multiplayer question sync + map pin (2 browsers)', () => {
  test('seeker asks → hider sees it, answers in-app → seeker records it; map shows the ask-time pin', async ({
    browser,
  }) => {
    // Host (seeker) gets a granted, fixed GPS so the ask carries an ask-time
    // position (MAP-009). The joiner is the hider.
    const hostCtx = await browser.newContext({
      permissions: ['geolocation'],
      geolocation: { latitude: 36.1223, longitude: -97.0687 }, // OSU Student Union
    })
    const joinCtx = await browser.newContext()

    const { page: seeker, code } = await createHost(hostCtx, 'Hank')
    const hider = await joinRoom(joinCtx, code, 'Sam')

    // Host sees the joiner; pick the joiner (Sam) as the hider.
    await expect(seeker.getByTestId('lobby-roster')).toContainText('Sam')
    await seeker.getByTestId('lobby-roster').getByRole('button', { name: 'Sam' }).click()
    await expect(seeker.getByTestId('start-game-btn')).toBeEnabled()
    // Wait for the joiner to receive the hider role before starting (avoids a
    // race where they'd enter the game still shown as a seeker).
    await expect(hider.getByTestId('lobby-roster')).toContainText('HIDER', { timeout: 15_000 })

    // Start → both navigate to the game with their locked roles.
    await seeker.getByTestId('start-game-btn').click()
    await expect(seeker).toHaveURL(/\/game/)
    await expect(hider).toHaveURL(/\/game/)
    await expect(seeker.getByTestId('current-role-display')).toContainText(/seeker/i)
    await expect(hider.getByTestId('current-role-display')).toContainText(/hider/i)

    // Establish a GPS fix on the seeker: MapPanel only starts geolocation when
    // the map tab is open, and the ask stamps that position (MAP-009).
    await seeker.getByTestId('bottom-nav').getByRole('button', { name: 'Map' }).click()
    await expect(seeker.getByTestId('base-map-canvas')).toBeVisible()

    // Host ends the hiding period from the Admin tab → SEEKING (questions unlock).
    await seeker.getByTestId('bottom-nav').getByRole('button', { name: 'Admin' }).click()
    await seeker.getByTestId('admin-end-hiding-btn').click()
    await seeker.getByTestId('admin-end-hiding-confirm-btn').click()

    // ── QSYNC-004: seeker asks a radar question ──
    await seeker.getByTestId('bottom-nav').getByRole('button', { name: 'Questions' }).click()
    const tile = seeker.getByTestId(`question-tile-${RADAR_QUESTION_ID}`)
    await expect(tile).toBeEnabled({ timeout: 15_000 })
    await tile.click()
    // The ask modal opens; confirm the ask.
    await expect(seeker.getByTestId('ask-question-modal')).toBeVisible()
    await seeker.getByRole('button', { name: 'Ask', exact: true }).click()

    // The HIDER's device shows the pending question in the answer prompt (relayed
    // over the live WS — the core QSYNC-004 behavior). QSYNC-006: the prompt is
    // now always-mounted for the hider, so it appears on their DEFAULT tab
    // (Questions) without navigating to Cards — and the Cards nav item is badged.
    await expect(hider.getByTestId('hider-answer-prompt')).toBeVisible({ timeout: 15_000 })
    await expect(hider.getByTestId('hider-answer-question')).not.toBeEmpty()
    await expect(hider.getByTestId('nav-badge-cards')).toBeVisible()

    // ── MAP-009: the hider's map shows the seeker's ask-time pin ──
    await hider.getByTestId('bottom-nav').getByRole('button', { name: 'Map' }).click()
    await expect(hider.getByTestId('base-map-canvas')).toBeVisible()
    // The ask-time pin is an L.marker with our teardrop "?" divIcon.
    await expect(hider.locator('.askedfrom-pin').first()).toBeVisible({ timeout: 15_000 })

    // ── QSYNC-005 + QSYNC-006: the hider answers "Yes" from the default
    // (Questions) tab — no need to visit Cards. Switch off the Map tab first so
    // the Leaflet canvas isn't overlaying the prompt for the click.
    await hider.getByTestId('bottom-nav').getByRole('button', { name: 'Questions' }).click()
    await expect(hider.getByTestId('hider-answer-prompt')).toBeVisible()
    await hider.getByTestId('hider-answer-yes').click()

    // The prompt clears on the hider (question resolved)...
    await expect(hider.getByTestId('hider-answer-prompt')).toBeHidden({ timeout: 15_000 })

    // ...and the seeker's question history records the answer relayed back over
    // the wire (QSYNC-005: the hider's in-app answer reached the seeker).
    await seeker.getByTestId('bottom-nav').getByRole('button', { name: 'History' }).click()
    await expect(seeker.getByTestId(`history-item-${RADAR_QUESTION_ID}`)).toContainText(/yes/i, {
      timeout: 15_000,
    })

    await hostCtx.close()
    await joinCtx.close()
  })

  // Issue #29: the seeker asks a thermometer question, places a START + END pin
  // on their map and sends the travel vector; the HIDER's map shows the vector
  // (two pins + arrow line) so they can judge hotter/colder.
  test('seeker sends a thermometer travel vector → hider map shows the start/end pins', async ({
    browser,
  }) => {
    const hostCtx = await browser.newContext()
    const joinCtx = await browser.newContext()

    const { page: seeker, code } = await createHost(hostCtx, 'Hank')
    const hider = await joinRoom(joinCtx, code, 'Sam')

    await expect(seeker.getByTestId('lobby-roster')).toContainText('Sam')
    await seeker.getByTestId('lobby-roster').getByRole('button', { name: 'Sam' }).click()
    await expect(seeker.getByTestId('start-game-btn')).toBeEnabled()
    await expect(hider.getByTestId('lobby-roster')).toContainText('HIDER', { timeout: 15_000 })

    await seeker.getByTestId('start-game-btn').click()
    await expect(seeker).toHaveURL(/\/game/)
    await expect(hider).toHaveURL(/\/game/)

    // End the hiding period so questions unlock.
    await seeker.getByTestId('bottom-nav').getByRole('button', { name: 'Admin' }).click()
    await seeker.getByTestId('admin-end-hiding-btn').click()
    await seeker.getByTestId('admin-end-hiding-confirm-btn').click()

    // Seeker asks the thermometer question.
    await seeker.getByTestId('bottom-nav').getByRole('button', { name: 'Questions' }).click()
    const tile = seeker.getByTestId(`question-tile-${THERMOMETER_QUESTION_ID}`)
    await expect(tile).toBeEnabled({ timeout: 15_000 })
    await tile.click()
    await expect(seeker.getByTestId('ask-question-modal')).toBeVisible()
    await seeker.getByRole('button', { name: 'Ask', exact: true }).click()

    // On the map, the seeker's thermometer send-vector panel appears (the
    // question is pending). Place two pins by tapping the map, then send.
    await seeker.getByTestId('bottom-nav').getByRole('button', { name: 'Map' }).click()
    const map = seeker.getByTestId('base-map-canvas')
    await expect(map).toBeVisible()
    await expect(seeker.getByTestId('thermo-panel')).toBeVisible({ timeout: 15_000 })
    await seeker.getByTestId('thermo-place-btn').click()
    // Two distinct taps on the map = start pin then end pin.
    const box = (await map.boundingBox())!
    await seeker.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.5)
    await seeker.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.5)
    await expect(seeker.getByTestId('thermo-send-btn')).toBeEnabled()
    await seeker.getByTestId('thermo-send-btn').click()

    // The HIDER's map shows the thermometer vector (start/end pins rendered as
    // .thermo-pin markers) relayed over the live WS.
    await hider.getByTestId('bottom-nav').getByRole('button', { name: 'Map' }).click()
    await expect(hider.getByTestId('base-map-canvas')).toBeVisible()
    await expect(hider.locator('.thermo-pin').first()).toBeVisible({ timeout: 15_000 })
    // Both endpoints are present.
    await expect(hider.locator('.thermo-pin')).toHaveCount(2, { timeout: 15_000 })

    await hostCtx.close()
    await joinCtx.close()
  })
})
