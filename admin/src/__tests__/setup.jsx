/**
 * Vitest-Setup für Admin-Tests.
 */
import '@testing-library/jest-dom'

// Firebase mocken
vi.mock('@/firebase.js', () => ({
  db: {},
  auth: { currentUser: null },
  functions: {},
}))

vi.mock('@support-chat/shared', async () => {
  const actual = await vi.importActual('../../../shared/src/constants.js')
  return actual
})
