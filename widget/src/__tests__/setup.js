/**
 * Vitest-Setup für Widget-Tests.
 * Wird vor jedem Test-File ausgeführt.
 */
import '@testing-library/jest-dom'

// Firebase-Module mocken damit keine echten Netzwerkanfragen gemacht werden
vi.mock('../firebase.js', () => ({
  db: {},
  auth: { currentUser: null },
}))

// Shared-Modul-Konstanten direkt verfügbar machen
vi.mock('@support-chat/shared', async () => {
  const actual = await vi.importActual('../../../shared/src/constants.js')
  return actual
})
