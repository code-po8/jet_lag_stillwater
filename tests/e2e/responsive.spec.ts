/**
 * E2E Tests for Responsive Layout (UX-001)
 *
 * Tests that verify the app works well on mobile devices:
 * - All views work on screens 320px and up
 * - Touch targets minimum 44x44px
 * - No horizontal scrolling on main views
 * - Text readable without zooming
 */

import { test, expect, type Locator, type Page } from '@playwright/test'

// Test on both desktop and mobile viewports
// The mobile-chrome project in playwright.config.ts uses Pixel 5 (393x851)
// We also want to test the minimum 320px width

test.describe('Responsive Layout - 320px width', () => {
  test.use({ viewport: { width: 320, height: 568 } }) // iPhone SE size

  test.describe('Home Page', () => {
    test('should display without horizontal scrolling', async ({ page }) => {
      await page.goto('/')

      // Check that the page doesn't have horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(hasHorizontalScroll).toBe(false)
    })

    test('should have readable text without zooming', async ({ page }) => {
      await page.goto('/')

      const header = page.getByRole('heading', { name: 'Jet Lag: Stillwater' })
      await expect(header).toBeVisible()

      // Check font size is at least 16px (readable without zooming)
      const fontSize = await header.evaluate((el) => {
        return parseFloat(window.getComputedStyle(el).fontSize)
      })
      expect(fontSize).toBeGreaterThanOrEqual(16)
    })

    test('should have touch-friendly New Game button (min 44px height)', async ({ page }) => {
      await page.goto('/')

      const newGameBtn = page.getByRole('link', { name: 'New Game' })
      await expect(newGameBtn).toBeVisible()

      const box = await newGameBtn.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.height).toBeGreaterThanOrEqual(44)
    })
  })

  test.describe('Game Setup Page', () => {
    test('should display without horizontal scrolling', async ({ page }) => {
      await page.goto('/setup')

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      expect(hasHorizontalScroll).toBe(false)
    })

    test('should have touch-friendly Add Player button (min 44px height)', async ({ page }) => {
      await page.goto('/setup')

      const addButton = page.getByRole('button', { name: 'Add Player' })
      await expect(addButton).toBeVisible()

      const box = await addButton.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.height).toBeGreaterThanOrEqual(44)
    })

    test('should have touch-friendly game size buttons (min 44px height)', async ({ page }) => {
      await page.goto('/setup')

      // Find game size buttons (Small, Medium, Large)
      const smallButton = page.getByTestId('game-size-small')
      await expect(smallButton).toBeVisible()

      const box = await smallButton.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.height).toBeGreaterThanOrEqual(44)
    })

    test('should have touch-friendly Start Game button (min 44px height)', async ({ page }) => {
      await page.goto('/setup')

      const startButton = page.getByRole('button', { name: 'Start Game' })
      await expect(startButton).toBeVisible()

      const box = await startButton.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.height).toBeGreaterThanOrEqual(44)
    })

    test('should display player management form correctly', async ({ page }) => {
      await page.goto('/setup')

      // Input and button should be side by side but fit within 320px
      const input = page.getByPlaceholder('Player name')
      await expect(input).toBeVisible()

      const inputBox = await input.boundingBox()
      expect(inputBox).not.toBeNull()
      expect(inputBox!.width).toBeLessThan(320) // Should fit within viewport
    })
  })
})

// Test with Pixel 5 mobile viewport (default in mobile-chrome project)
test.describe('Responsive Layout - Mobile Chrome (Pixel 5)', () => {
  test.use({ viewport: { width: 393, height: 851 } })

  test.describe('Home Page', () => {
    test('should center content vertically and horizontally', async ({ page }) => {
      await page.goto('/')

      const header = page.getByRole('heading', { name: 'Jet Lag: Stillwater' })
      await expect(header).toBeVisible()

      // Content should be centered
      const box = await header.boundingBox()
      expect(box).not.toBeNull()
      // Header should be roughly centered horizontally (within viewport)
      expect(box!.x + box!.width / 2).toBeGreaterThan(100)
      expect(box!.x + box!.width / 2).toBeLessThan(293)
    })
  })

  test.describe('Game Setup Page', () => {
    test('should allow adding players and show them in list', async ({ page }) => {
      await page.goto('/setup')

      // Add a player
      await page.getByPlaceholder('Player name').fill('Alice')
      await page.getByRole('button', { name: 'Add Player' }).click()

      // Player should appear in list (find it in the player list section)
      const playersList = page.locator('ul.space-y-2')
      await expect(playersList.getByText('Alice')).toBeVisible()

      // Add another player
      await page.getByPlaceholder('Player name').fill('Bob')
      await page.getByRole('button', { name: 'Add Player' }).click()

      // Bob should appear in the player list
      await expect(playersList.getByText('Bob')).toBeVisible()
    })

    test('should show hider selection after adding 2+ players', async ({ page }) => {
      await page.goto('/setup')

      // Add two players
      await page.getByPlaceholder('Player name').fill('Alice')
      await page.getByRole('button', { name: 'Add Player' }).click()

      await page.getByPlaceholder('Player name').fill('Bob')
      await page.getByRole('button', { name: 'Add Player' }).click()

      // Hider selection should now be visible
      await expect(page.getByText('Choose First Hider')).toBeVisible()
    })
  })
})

// Helper function to check touch target size
async function checkTouchTargetSize(locator: Locator, minSize: number = 44): Promise<void> {
  const box = await locator.boundingBox()
  expect(box).not.toBeNull()
  expect(box!.height).toBeGreaterThanOrEqual(minSize)
  expect(box!.width).toBeGreaterThanOrEqual(minSize)
}

// Tests that run on both iOS Safari and Android Chrome equivalent viewports
test.describe('Touch Targets', () => {
  test.use({ viewport: { width: 320, height: 568 } })

  test('Home page New Game button should be at least 44x44', async ({ page }) => {
    await page.goto('/')
    const btn = page.getByRole('link', { name: 'New Game' })
    await checkTouchTargetSize(btn)
  })

  test('Setup page Add Player button should be at least 44px height', async ({ page }) => {
    await page.goto('/setup')
    const btn = page.getByRole('button', { name: 'Add Player' })
    await expect(btn).toBeVisible()

    const box = await btn.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  })

  test('Setup page Start Game button should be at least 44px height', async ({ page }) => {
    await page.goto('/setup')
    const btn = page.getByRole('button', { name: 'Start Game' })
    await expect(btn).toBeVisible()

    const box = await btn.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  })
})

test.describe('No Horizontal Scroll', () => {
  test.use({ viewport: { width: 320, height: 568 } })

  async function verifyNoHorizontalScroll(page: Page): Promise<void> {
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  }

  test('Home page should not have horizontal scroll', async ({ page }) => {
    await page.goto('/')
    await verifyNoHorizontalScroll(page)
  })

  test('Setup page should not have horizontal scroll', async ({ page }) => {
    await page.goto('/setup')
    await verifyNoHorizontalScroll(page)
  })
})

test.describe('Text Readability', () => {
  test.use({ viewport: { width: 320, height: 568 } })

  test('body text should use minimum 14px font size', async ({ page }) => {
    await page.goto('/setup')

    // Check the instruction text
    const instructionText = page.getByText('Add at least 2 players to start')
    await expect(instructionText).toBeVisible()

    const fontSize = await instructionText.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize)
    })
    // 14px is the minimum readable size on mobile without zooming
    expect(fontSize).toBeGreaterThanOrEqual(14)
  })

  test('headings should be large enough to be clearly visible', async ({ page }) => {
    await page.goto('/setup')

    const heading = page.getByRole('heading', { name: 'Game Setup' })
    await expect(heading).toBeVisible()

    const fontSize = await heading.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize)
    })
    // Headings should be at least 20px
    expect(fontSize).toBeGreaterThanOrEqual(20)
  })
})
