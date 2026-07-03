import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should display the correct page title', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Jet Lag Stillwater/)
  })

  test('should display the app header', async ({ page }) => {
    await page.goto('/')

    // The title renders as "JET" / "LAG" spans inside the <h1> (STILLWATER is a
    // sibling subtitle span, not part of the heading), so the heading's
    // accessible name is "JET LAG".
    const header = page.getByRole('heading', { name: 'JET LAG' })
    await expect(header).toBeVisible()

    // And the Stillwater subtitle is present alongside it.
    await expect(page.getByText('STILLWATER')).toBeVisible()
  })

  test('should display the subtitle', async ({ page }) => {
    await page.goto('/')

    const subtitle = page.getByText('Hide and Seek on the OSU Bus System')
    await expect(subtitle).toBeVisible()
  })

  test('should have a New Game button', async ({ page }) => {
    await page.goto('/')

    const newGameLink = page.getByRole('link', { name: 'New Game' })
    await expect(newGameLink).toBeVisible()
  })

  test('should navigate to setup page when clicking New Game', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('link', { name: 'New Game' }).click()

    await expect(page).toHaveURL(/\/setup/)
  })
})
