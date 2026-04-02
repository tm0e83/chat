/**
 * Unit-Tests für das chat.js-Modul.
 * Testet Domain-Check und Konversations-ID-Generierung ohne echte Firebase-Verbindung.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isDomainAllowed, buildConversationId } from '../chat.js'

// Firestore-Funktionen mocken
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  addDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()), // gibt Unsubscribe-Funktion zurück
  serverTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
  increment: vi.fn((n) => ({ _type: 'increment', n })),
}))

describe('isDomainAllowed', () => {
  it('gibt true zurück wenn Domain in der Whitelist ist', () => {
    expect(isDomainAllowed(['example.com', 'shop.example.com'], 'example.com')).toBe(true)
  })

  it('gibt true zurück für Subdomains wenn explizit eingetragen', () => {
    expect(isDomainAllowed(['shop.example.com'], 'shop.example.com')).toBe(true)
  })

  it('gibt false zurück wenn Domain NICHT in der Whitelist ist', () => {
    expect(isDomainAllowed(['example.com'], 'other.com')).toBe(false)
  })

  it('gibt false zurück für leere Whitelist', () => {
    expect(isDomainAllowed([], 'example.com')).toBe(false)
  })

  it('gibt false zurück wenn Whitelist kein Array ist', () => {
    expect(isDomainAllowed(null, 'example.com')).toBe(false)
    expect(isDomainAllowed(undefined, 'example.com')).toBe(false)
  })

  it('unterscheidet zwischen Domain und Subdomain', () => {
    // Nur "example.com" eingetragen — "sub.example.com" darf NICHT erlaubt sein
    expect(isDomainAllowed(['example.com'], 'sub.example.com')).toBe(false)
  })
})

describe('buildConversationId', () => {
  it('kombiniert tenantId und userId mit Unterstrich', () => {
    expect(buildConversationId('tenant-1', 'user-abc')).toBe('tenant-1_user-abc')
  })

  it('ist deterministisch (gleiche Eingaben = gleicher Output)', () => {
    const id1 = buildConversationId('t1', 'u1')
    const id2 = buildConversationId('t1', 'u1')
    expect(id1).toBe(id2)
  })

  it('unterscheidet verschiedene tenantIds', () => {
    expect(buildConversationId('tenant-a', 'user-1'))
      .not.toBe(buildConversationId('tenant-b', 'user-1'))
  })

  it('unterscheidet verschiedene userIds', () => {
    expect(buildConversationId('tenant-1', 'user-a'))
      .not.toBe(buildConversationId('tenant-1', 'user-b'))
  })
})
