import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test('should display the correct page title', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Jet Lag Stillwater/)
  })

  test('should display the app header', async ({ page }) => {
    await page.goto('/')

    const header = page.getByRole('heading', { name: 'Jet Lag: Stillwater' })
    await expect(header).toBeVisible()
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
