/**
 * E2E-Tests für den Login-Flow des Admin-Dashboards.
 *
 * Voraussetzung: Admin-Dev-Server läuft auf localhost:5173
 * Firebase Emulator läuft für Auth (Port 9099) und Firestore (Port 8080)
 */
import { test, expect } from '@playwright/test'

test.describe('Login-Seite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('zeigt Login-Formular', async ({ page }) => {
    await expect(page.getByLabel('E-Mail')).toBeVisible()
    await expect(page.getByLabel('Passwort')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible()
    await expect(page.getByText('Mit Google anmelden')).toBeVisible()
  })

  test('zeigt Fehlermeldung bei leeren Feldern', async ({ page }) => {
    await page.getByRole('button', { name: 'Anmelden' }).click()
    // HTML5-Validierung verhindert Submit — Felder sind required
    // Kein Firebase-Fehler wird geworfen
    await expect(page.getByLabel('E-Mail')).toBeFocused()
  })

  test('zeigt Fehlermeldung bei falschem Passwort', async ({ page }) => {
    await page.getByLabel('E-Mail').fill('nonexistent@test.com')
    await page.getByLabel('Passwort').fill('wrongpassword')
    await page.getByRole('button', { name: 'Anmelden' }).click()

    // Fehlermeldung erscheint
    await expect(
      page.getByText(/Passwort|E-Mail|Fehler/i),
    ).toBeVisible({ timeout: 5000 })
  })

  test('leitet nach erfolgreichem Login weiter', async ({ page }) => {
    // Dieser Test benötigt den Firebase Emulator mit einem Test-Admin-Account
    // Konfiguration via playwright.config.js und Firebase Emulator
    test.skip(!process.env.E2E_ADMIN_EMAIL, 'E2E_ADMIN_EMAIL nicht gesetzt')

    await page.getByLabel('E-Mail').fill(process.env.E2E_ADMIN_EMAIL)
    await page.getByLabel('Passwort').fill(process.env.E2E_ADMIN_PASSWORD)
    await page.getByRole('button', { name: 'Anmelden' }).click()

    await expect(page).toHaveURL('/conversations', { timeout: 10000 })
  })
})

test.describe('Navigation', () => {
  test('leitet / zu /conversations um', async ({ page }) => {
    await page.goto('/')
    // Ohne Login → zu /login umleiten
    await expect(page).toHaveURL('/login')
  })

  test('leitet /conversations ohne Login zu /login um', async ({ page }) => {
    await page.goto('/conversations')
    await expect(page).toHaveURL('/login')
  })
})
