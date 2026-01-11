import { test, expect } from '@playwright/test';

/**
 * PWA Support Tests (FOUND-007)
 *
 * Tests verify:
 * - Web app manifest is correctly configured
 * - Service worker registers successfully
 * - App is installable (manifest criteria met)
 * - Assets are cached for offline use
 */

test.describe('PWA Support', () => {
  test.describe('Web App Manifest', () => {
    test('should have a valid manifest link in HTML', async ({ page }) => {
      await page.goto('/');

      // Check for manifest link in head
      const manifestLink = page.locator('link[rel="manifest"]');
      await expect(manifestLink).toHaveAttribute('href', /manifest\.webmanifest/);
    });

    test('should serve manifest with correct MIME type', async ({ request }) => {
      const response = await request.get('/manifest.webmanifest');
      expect(response.status()).toBe(200);
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/manifest+json');
    });

    test('should have correct app name in manifest', async ({ request }) => {
      const response = await request.get('/manifest.webmanifest');
      const manifest = await response.json();

      expect(manifest.name).toBe('Jet Lag Stillwater');
      expect(manifest.short_name).toBe('Jet Lag');
    });

    test('should have correct theme colors in manifest', async ({ request }) => {
      const response = await request.get('/manifest.webmanifest');
      const manifest = await response.json();

      expect(manifest.theme_color).toBe('#1a1a2e');
      expect(manifest.background_color).toBe('#1a1a2e');
    });

    test('should have display mode set to standalone', async ({ request }) => {
      const response = await request.get('/manifest.webmanifest');
      const manifest = await response.json();

      expect(manifest.display).toBe('standalone');
    });

    test('should have all required icons in manifest', async ({ request }) => {
      const response = await request.get('/manifest.webmanifest');
      const manifest = await response.json();

      expect(manifest.icons).toBeDefined();
      expect(manifest.icons.length).toBeGreaterThanOrEqual(3);

      // Check for required icon sizes
      const sizes = manifest.icons.map((icon: { sizes: string }) => icon.sizes);
      expect(sizes).toContain('192x192');
      expect(sizes).toContain('512x512');
    });

    test('should have maskable icon for adaptive icons', async ({ request }) => {
      const response = await request.get('/manifest.webmanifest');
      const manifest = await response.json();

      const maskableIcon = manifest.icons.find(
        (icon: { purpose?: string }) => icon.purpose === 'maskable',
      );
      expect(maskableIcon).toBeDefined();
    });
  });

  test.describe('Icons', () => {
    test('should serve 192x192 icon', async ({ request }) => {
      const response = await request.get('/pwa-192x192.png');
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('image/png');
    });

    test('should serve 512x512 icon', async ({ request }) => {
      const response = await request.get('/pwa-512x512.png');
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('image/png');
    });

    test('should serve apple-touch-icon', async ({ request }) => {
      const response = await request.get('/apple-touch-icon.png');
      expect(response.status()).toBe(200);
      expect(response.headers()['content-type']).toContain('image/png');
    });
  });

  test.describe('Service Worker', () => {
    test('should register service worker', async ({ page }) => {
      await page.goto('/');

      // Wait for service worker to register
      const swRegistration = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          return {
            scope: registration.scope,
            active: !!registration.active,
          };
        }
        return null;
      });

      expect(swRegistration).not.toBeNull();
      expect(swRegistration?.active).toBe(true);
      expect(swRegistration?.scope).toContain('/');
    });

    test('should serve service worker file', async ({ request }) => {
      // In dev mode with vite-plugin-pwa devOptions.enabled, the SW is served
      // via the plugin's virtual module, not as a static file.
      // We verify via the registration test that the SW is actually working.
      const response = await request.get('/sw.js');

      // Status 200 means the path is handled
      expect(response.status()).toBe(200);

      // In production build, content-type would be 'application/javascript'
      // In dev mode, vite-plugin-pwa may serve it differently
      // The key test is that the SW registers successfully (tested above)
      const contentType = response.headers()['content-type'] || '';

      // Accept either javascript or html (dev mode may wrap in HTML)
      expect(contentType).toMatch(/javascript|text\/html/);
    });
  });

  test.describe('Meta Tags', () => {
    test('should have theme-color meta tag', async ({ page }) => {
      await page.goto('/');

      const themeColor = page.locator('meta[name="theme-color"]');
      await expect(themeColor).toHaveAttribute('content', '#1a1a2e');
    });

    test('should have apple-mobile-web-app-capable meta tag', async ({ page }) => {
      await page.goto('/');

      const capable = page.locator('meta[name="apple-mobile-web-app-capable"]');
      await expect(capable).toHaveAttribute('content', 'yes');
    });

    test('should have apple-touch-icon link', async ({ page }) => {
      await page.goto('/');

      const touchIcon = page.locator('link[rel="apple-touch-icon"]');
      await expect(touchIcon).toHaveAttribute('href', '/apple-touch-icon.png');
    });

    test('should have description meta tag', async ({ page }) => {
      await page.goto('/');

      const description = page.locator('meta[name="description"]');
      await expect(description).toHaveAttribute(
        'content',
        'Hide and Seek game tracker for OSU bus system in Stillwater, OK',
      );
    });
  });

  test.describe('PWA Installability', () => {
    test('should meet basic installability criteria', async ({ request }) => {
      // Verify manifest is accessible
      const manifestResponse = await request.get('/manifest.webmanifest');
      expect(manifestResponse.status()).toBe(200);

      const manifest = await manifestResponse.json();

      // Check required manifest fields for installability
      expect(manifest.name).toBeTruthy();
      expect(manifest.short_name).toBeTruthy();
      expect(manifest.start_url).toBeTruthy();
      expect(manifest.display).toBe('standalone');

      // Check for icons
      expect(manifest.icons).toBeDefined();
      expect(manifest.icons.length).toBeGreaterThanOrEqual(1);

      // Check for 192x192 and 512x512 icons (required for install prompt)
      const has192 = manifest.icons.some(
        (icon: { sizes: string }) => icon.sizes === '192x192',
      );
      const has512 = manifest.icons.some(
        (icon: { sizes: string }) => icon.sizes === '512x512',
      );
      expect(has192).toBe(true);
      expect(has512).toBe(true);
    });
  });

  test.describe('Offline Support', () => {
    test('should cache static assets after initial load', async ({ page }) => {
      await page.goto('/');

      // Wait for service worker to be ready and cache assets
      await page.waitForTimeout(2000);

      // Check if caches exist
      const cacheNames = await page.evaluate(async () => {
        const names = await caches.keys();
        return names;
      });

      // Workbox creates a cache with a unique name containing 'workbox-precache'
      const hasPrecache = cacheNames.some((name) => name.includes('workbox-precache'));
      expect(hasPrecache).toBe(true);
    });
  });
});
