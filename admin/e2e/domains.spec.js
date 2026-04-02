/**
 * E2E-Tests für die Domain-Verwaltung.
 * Benötigt einen eingeloggten Admin-Nutzer (via Cookie oder Storage).
 */
import { test, expect } from '@playwright/test'

// Alle Tests in dieser Datei benötigen einen eingeloggten Nutzer
test.use({ storageState: 'e2e/.auth/admin.json' })

test.describe('Domains-Seite', () => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL,
    'E2E_ADMIN_EMAIL nicht gesetzt — Firebase Emulator erforderlich',
  )

  test.beforeEach(async ({ page }) => {
    await page.goto('/domains')
  })

  test('zeigt Domain-Seite', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Domain-Whitelist' })).toBeVisible()
  })

  test('kann eine Domain hinzufügen', async ({ page }) => {
    await page.getByPlaceholder('example.com').fill('test-e2e.com')
    await page.getByRole('button', { name: 'Hinzufügen' }).click()

    await expect(page.getByText('test-e2e.com')).toBeVisible({ timeout: 5000 })
  })

  test('zeigt Fehler bei ungültigem Hostnamen', async ({ page }) => {
    await page.getByPlaceholder('example.com').fill('not a valid domain!')
    await page.getByRole('button', { name: 'Hinzufügen' }).click()

    await expect(page.getByText(/gültigen Hostnamen/i)).toBeVisible()
  })

  test('kann eine Domain entfernen', async ({ page }) => {
    // Domain zuerst hinzufügen
    await page.getByPlaceholder('example.com').fill('to-remove.com')
    await page.getByRole('button', { name: 'Hinzufügen' }).click()
    await expect(page.getByText('to-remove.com')).toBeVisible()

    // Dann entfernen
    await page.getByRole('button', { name: 'to-remove.com entfernen' }).click()
    await expect(page.getByText('to-remove.com')).not.toBeVisible({ timeout: 5000 })
  })
})
