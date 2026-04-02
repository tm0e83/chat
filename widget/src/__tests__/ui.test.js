/**
 * Unit-Tests für das ui.js-Modul.
 * Testet DOM-Erstellung und -Manipulation im Shadow DOM.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// styles.css?inline-Import mocken (Vite-Feature, nicht in Node verfügbar)
vi.mock('../styles.css?inline', () => ({ default: '/* mocked styles */' }))

import { renderConsentView, renderAuthView, renderEmptyView } from '../ui.js'

describe('renderConsentView', () => {
  it('enthält einen Zustimmen-Button', () => {
    const onAccept = vi.fn()
    const el = renderConsentView({ privacyUrl: '', onAccept })
    const btn = el.querySelector('.sc-consent-accept')
    expect(btn).not.toBeNull()
    expect(btn.textContent).toContain('Zustimmen')
  })

  it('ruft onAccept auf wenn Button geklickt wird', () => {
    const onAccept = vi.fn()
    const el = renderConsentView({ privacyUrl: '', onAccept })
    el.querySelector('.sc-consent-accept').click()
    expect(onAccept).toHaveBeenCalledOnce()
  })

  it('zeigt Datenschutz-Link wenn privacyUrl gesetzt ist', () => {
    const el = renderConsentView({
      privacyUrl: 'https://example.com/datenschutz',
      onAccept: vi.fn(),
    })
    const link = el.querySelector('.sc-consent-link')
    expect(link).not.toBeNull()
    expect(link.getAttribute('href')).toBe('https://example.com/datenschutz')
  })

  it('zeigt keinen Link wenn privacyUrl leer ist', () => {
    const el = renderConsentView({ privacyUrl: '', onAccept: vi.fn() })
    expect(el.querySelector('.sc-consent-link')).toBeNull()
  })
})

describe('renderAuthView', () => {
  it('enthält E-Mail- und Passwort-Felder', () => {
    const el = renderAuthView({ onEmailAuth: vi.fn(), onGoogle: vi.fn() })
    expect(el.querySelector('input[type="email"]')).not.toBeNull()
    expect(el.querySelector('input[type="password"]')).not.toBeNull()
  })

  it('enthält einen Google-Login-Button', () => {
    const el = renderAuthView({ onEmailAuth: vi.fn(), onGoogle: vi.fn() })
    expect(el.querySelector('.sc-btn-google')).not.toBeNull()
  })

  it('zeigt Fehlermeldung wenn E-Mail leer ist', async () => {
    const el = renderAuthView({ onEmailAuth: vi.fn(), onGoogle: vi.fn() })
    const submitBtn = el.querySelector('.sc-btn-submit')
    const errorEl = el.querySelector('.sc-error')

    submitBtn.click()

    expect(errorEl.style.display).toBe('block')
    expect(errorEl.textContent).toContain('E-Mail')
  })

  it('ruft onEmailAuth mit korrekten Parametern auf', async () => {
    const onEmailAuth = vi.fn().mockResolvedValue({})
    const el = renderAuthView({ onEmailAuth, onGoogle: vi.fn() })

    el.querySelector('input[type="email"]').value = 'test@example.com'
    el.querySelector('input[type="password"]').value = 'password123'
    el.querySelector('.sc-btn-submit').click()

    // onEmailAuth wird async aufgerufen
    await vi.waitFor(() => {
      expect(onEmailAuth).toHaveBeenCalledWith('test@example.com', 'password123', false)
    })
  })

  it('wechselt zwischen Login und Registrierung', () => {
    const el = renderAuthView({ onEmailAuth: vi.fn(), onGoogle: vi.fn() })

    // Initial: Login-Modus
    expect(el.querySelector('.sc-auth-title').textContent).toBe('Willkommen')

    // Toggle klicken
    el.querySelector('.sc-toggle-btn').click()

    // Jetzt: Registrierungs-Modus
    expect(el.querySelector('.sc-auth-title').textContent).toBe('Konto erstellen')
  })
})

describe('renderEmptyView', () => {
  it('zeigt den Begrüßungstext', () => {
    const el = renderEmptyView('Wie können wir helfen?')
    expect(el.textContent).toContain('Wie können wir helfen?')
  })

  it('escaped HTML in Begrüßungstext', () => {
    const el = renderEmptyView('<script>alert("xss")</script>')
    // Sollte als escaped Text rendern, nicht als HTML
    expect(el.innerHTML).not.toContain('<script>')
    expect(el.textContent).toContain('<script>')
  })
})
