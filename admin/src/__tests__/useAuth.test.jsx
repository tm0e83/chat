/**
 * Tests für den useAuth-Hook.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth.js'

// onAuthStateChanged mocken
let authChangeCallback = null

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, cb) => {
    authChangeCallback = cb
    return vi.fn() // Unsubscribe
  }),
}))

describe('useAuth', () => {
  beforeEach(() => {
    authChangeCallback = null
  })

  it('startet im loading-Zustand', () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
  })

  it('setzt user auf null wenn nicht eingeloggt', async () => {
    const { result } = renderHook(() => useAuth())

    // Auth-Callback mit null aufrufen (kein Nutzer)
    authChangeCallback(null)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.user).toBeNull()
      expect(result.current.role).toBeNull()
    })
  })

  it('liest Admin-Rolle aus Custom Claims', async () => {
    const mockUser = {
      uid: 'user-123',
      email: 'admin@test.com',
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: { role: 'admin', tenantId: 'tenant-abc' },
      }),
    }

    const { result } = renderHook(() => useAuth())
    authChangeCallback(mockUser)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.user).toBe(mockUser)
      expect(result.current.role).toBe('admin')
      expect(result.current.tenantId).toBe('tenant-abc')
    })
  })

  it('liest Super-Admin-Rolle aus Custom Claims', async () => {
    const mockUser = {
      uid: 'superadmin-1',
      email: 'super@test.com',
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: { role: 'superadmin' },
      }),
    }

    const { result } = renderHook(() => useAuth())
    authChangeCallback(mockUser)

    await waitFor(() => {
      expect(result.current.role).toBe('superadmin')
      expect(result.current.tenantId).toBeNull()
    })
  })

  it('setzt role auf null wenn keine Admin-Claims vorhanden', async () => {
    const mockUser = {
      uid: 'regular-user',
      email: 'user@test.com',
      getIdTokenResult: vi.fn().mockResolvedValue({
        claims: {}, // Keine Rolle
      }),
    }

    const { result } = renderHook(() => useAuth())
    authChangeCallback(mockUser)

    await waitFor(() => {
      expect(result.current.role).toBeNull()
    })
  })
})
