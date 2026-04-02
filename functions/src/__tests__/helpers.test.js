/**
 * Unit-Tests für die helpers.js-Hilfsfunktionen.
 */
import { describe, it, expect } from 'vitest'
import { assertSuperAdmin, assertAdminOf } from '../helpers.js'

// HttpsError wird von firebase-functions geworfen — vereinfachter Mock
vi.mock('firebase-functions/v2/https', () => ({
  HttpsError: class HttpsError extends Error {
    constructor(code, message) {
      super(message)
      this.code = code
    }
  },
  onCall: vi.fn(),
}))

describe('assertSuperAdmin', () => {
  it('wirft keinen Fehler wenn Super-Admin', () => {
    const auth = { token: { role: 'superadmin' } }
    expect(() => assertSuperAdmin(auth)).not.toThrow()
  })

  it('wirft permission-denied für Tenant-Admin', () => {
    const auth = { token: { role: 'admin', tenantId: 'tenant-1' } }
    expect(() => assertSuperAdmin(auth)).toThrowError('permission-denied')
  })

  it('wirft permission-denied für nicht-authentifizierten Aufruf', () => {
    expect(() => assertSuperAdmin(null)).toThrowError('permission-denied')
  })

  it('wirft permission-denied für Nutzer ohne Rolle', () => {
    const auth = { token: {} }
    expect(() => assertSuperAdmin(auth)).toThrowError('permission-denied')
  })
})

describe('assertAdminOf', () => {
  it('wirft keinen Fehler für Super-Admin', () => {
    const auth = { token: { role: 'superadmin' } }
    expect(() => assertAdminOf(auth, 'any-tenant')).not.toThrow()
  })

  it('wirft keinen Fehler für Tenant-Admin des richtigen Tenants', () => {
    const auth = { token: { role: 'admin', tenantId: 'tenant-1' } }
    expect(() => assertAdminOf(auth, 'tenant-1')).not.toThrow()
  })

  it('wirft permission-denied für Tenant-Admin des falschen Tenants', () => {
    const auth = { token: { role: 'admin', tenantId: 'tenant-1' } }
    expect(() => assertAdminOf(auth, 'tenant-2')).toThrowError('permission-denied')
  })

  it('wirft unauthenticated wenn kein Auth', () => {
    expect(() => assertAdminOf(null, 'tenant-1')).toThrowError('unauthenticated')
  })
})
