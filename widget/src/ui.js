/**
 * UI-Modul des Support-Chat-Widgets.
 *
 * Verantwortlich für:
 * - Erstellen des Shadow DOM-Hosts (isoliert Widget-Styles von der Host-Seite)
 * - Rendern aller UI-Zustände (Consent, Auth, Chat)
 * - Fullscreen-Toggle
 * - Floating-Button und Inline-Modus
 */
import styles from './styles.css?inline'
import { translateAuthError, formatTime } from '@support-chat/shared'

/** @type {ShadowRoot|null} Referenz auf den Shadow DOM */
let shadowRoot = null

/** @type {HTMLElement|null} Das Chat-Fenster-Element */
let windowEl = null

/** @type {boolean} Ob das Fenster im Fullscreen-Modus ist */
let isFullscreen = false

/** @type {boolean} Ob das Fenster gerade offen ist (floating mode) */
let isOpen = false

// ─── SVG-Icons ────────────────────────────────────────────────────────────────

const ICONS = {
  chat: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>`,
  close: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>`,
  expand: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
    <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
  </svg>`,
  shrink: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
    <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
    <line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/>
  </svg>`,
  send: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>`,
  google: `<svg width="16" height="16" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>`,
}

// ─── Shadow DOM Setup ──────────────────────────────────────────────────────────

/**
 * Erstellt den Shadow DOM-Host und hängt ihn an den body.
 * Der Shadow DOM isoliert Widget-Styles vollständig von der Host-Seite.
 *
 * @param {'floating'|'inline'} mode - Widget-Modus
 * @param {string|null} targetSelector - CSS-Selektor für den Inline-Container
 * @returns {ShadowRoot} Der erstellte Shadow DOM
 */
export function createShadowRoot(mode = 'floating', targetSelector = null) {
  const host = document.createElement('div')
  host.id = 'support-chat-root'
  host.style.cssText = 'all: initial;' // Styles der Host-Seite vollständig isolieren

  if (mode === 'inline' && targetSelector) {
    const target = document.querySelector(targetSelector)
    if (target) {
      target.style.position = 'relative'
      target.appendChild(host)
    } else {
      console.warn(`[SupportChat] Ziel-Element "${targetSelector}" nicht gefunden.`)
      document.body.appendChild(host)
    }
  } else {
    document.body.appendChild(host)
  }

  // 'closed' verhindert, dass externe Scripts über host.shadowRoot auf das Widget zugreifen
  shadowRoot = host.attachShadow({ mode: 'closed' })

  // Styles in den Shadow DOM injizieren (als String, nicht als externes Stylesheet)
  const styleEl = document.createElement('style')
  styleEl.textContent = styles
  shadowRoot.appendChild(styleEl)

  return shadowRoot
}

// ─── Floating Button ───────────────────────────────────────────────────────────

/**
 * Erstellt und rendert den Floating-Button (Chat-Icon in der Ecke).
 *
 * @param {Function} onOpen - Callback wenn der Button geklickt wird
 * @returns {HTMLButtonElement}
 */
export function renderTriggerButton(onOpen) {
  const btn = document.createElement('button')
  btn.className = 'sc-trigger'
  btn.setAttribute('aria-label', 'Support-Chat öffnen')
  btn.innerHTML = ICONS.chat
  btn.addEventListener('click', onOpen)
  shadowRoot.appendChild(btn)
  return btn
}

/**
 * Aktualisiert den Unread-Badge auf dem Trigger-Button.
 * @param {HTMLButtonElement} btn
 * @param {number} count - Anzahl ungelesener Nachrichten
 */
export function updateTriggerBadge(btn, count) {
  let badge = btn.querySelector('.sc-trigger-badge')
  if (count > 0) {
    if (!badge) {
      badge = document.createElement('span')
      badge.className = 'sc-trigger-badge'
      btn.appendChild(badge)
    }
    badge.textContent = count > 99 ? '99+' : String(count)
  } else if (badge) {
    badge.remove()
  }
}

// ─── Chat-Fenster ──────────────────────────────────────────────────────────────

/**
 * Erstellt das Haupt-Chat-Fenster mit Header.
 *
 * @param {object} options
 * @param {string} options.title - Fenster-Titel
 * @param {string} options.subtitle - Untertitel (z.B. "Typischerweise antworten wir in...")
 * @param {'floating'|'inline'} options.mode - Widget-Modus
 * @param {Function} options.onClose - Callback für den Schließen-Button (nur floating)
 * @returns {HTMLElement} Das Fenster-Element
 */
export function createChatWindow({ title, subtitle, mode, onClose }) {
  windowEl = document.createElement('div')
  windowEl.className = mode === 'inline'
    ? 'sc-window sc-window--inline'
    : 'sc-window'

  // ── Header
  const header = document.createElement('div')
  header.className = 'sc-header'

  const titleGroup = document.createElement('div')
  titleGroup.innerHTML = `
    <div class="sc-header-title">${escapeHtml(title)}</div>
    ${subtitle ? `<div class="sc-header-subtitle">${escapeHtml(subtitle)}</div>` : ''}
  `

  const actions = document.createElement('div')
  actions.className = 'sc-header-actions'

  // Fullscreen-Toggle-Button
  const fullscreenBtn = document.createElement('button')
  fullscreenBtn.className = 'sc-icon-btn'
  fullscreenBtn.setAttribute('aria-label', 'Vollbild')
  fullscreenBtn.innerHTML = ICONS.expand
  fullscreenBtn.addEventListener('click', toggleFullscreen)
  actions.appendChild(fullscreenBtn)

  // Schließen-Button (nur im Floating-Modus)
  if (mode === 'floating' && onClose) {
    const closeBtn = document.createElement('button')
    closeBtn.className = 'sc-icon-btn'
    closeBtn.setAttribute('aria-label', 'Chat schließen')
    closeBtn.innerHTML = ICONS.close
    closeBtn.addEventListener('click', onClose)
    actions.appendChild(closeBtn)
  }

  header.appendChild(titleGroup)
  header.appendChild(actions)
  windowEl.appendChild(header)

  // Escape-Taste schließt Fullscreen
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isFullscreen) toggleFullscreen()
  })

  shadowRoot.appendChild(windowEl)
  return windowEl
}

/**
 * Wechselt zwischen normalem und Fullscreen-Modus.
 * Aktualisiert Icon und CSS-Klasse des Fensters.
 */
function toggleFullscreen() {
  if (!windowEl) return
  isFullscreen = !isFullscreen
  windowEl.classList.toggle('sc-window--fullscreen', isFullscreen)

  // Fullscreen-Button-Icon aktualisieren
  const fullscreenBtn = windowEl.querySelector('.sc-header-actions .sc-icon-btn:first-child')
  if (fullscreenBtn) {
    fullscreenBtn.innerHTML = isFullscreen ? ICONS.shrink : ICONS.expand
    fullscreenBtn.setAttribute('aria-label', isFullscreen ? 'Vollbild beenden' : 'Vollbild')
  }
}

/**
 * Zeigt/versteckt das Chat-Fenster (Floating-Modus).
 * @param {boolean} open
 */
export function setWindowVisible(open) {
  isOpen = open
  if (windowEl) windowEl.style.display = open ? 'flex' : 'none'
}

// ─── Inhalts-Bereiche ──────────────────────────────────────────────────────────

/**
 * Rendert den DSGVO-Consent-Banner.
 *
 * @param {object} options
 * @param {string} options.privacyUrl - Link zur Datenschutzerklärung
 * @param {Function} options.onAccept - Callback bei Zustimmung
 * @returns {HTMLElement}
 */
export function renderConsentView({ privacyUrl, onAccept }) {
  const el = document.createElement('div')
  el.className = 'sc-consent'
  el.innerHTML = `
    <p class="sc-consent-text">
      Diese Chat-Funktion verwendet <strong>Firebase (Google)</strong> zur sicheren Übertragung
      und Speicherung von Nachrichten. Die Daten werden auf Servern in Frankfurt (EU) verarbeitet.
      ${privacyUrl
        ? `<br><br><a class="sc-consent-link" href="${escapeHtml(privacyUrl)}" target="_blank" rel="noopener">
             Datenschutzerklärung lesen ↗
           </a>`
        : ''
      }
    </p>
    <button class="sc-btn sc-consent-accept">Zustimmen &amp; fortfahren</button>
  `
  el.querySelector('.sc-consent-accept').addEventListener('click', onAccept)
  return el
}

/**
 * Rendert das Authentifizierungs-Formular (Login/Registrierung).
 *
 * @param {object} options
 * @param {Function} options.onEmailAuth - Callback: (email, password, isRegister) => void
 * @param {Function} options.onGoogle - Callback für Google-Login
 * @returns {HTMLElement}
 */
export function renderAuthView({ onEmailAuth, onGoogle }) {
  let isRegister = false

  const el = document.createElement('div')
  el.className = 'sc-auth'

  let showPassword = false

  function render() {
    const pwType = showPassword ? 'text' : 'password'
    const toggleLabel = showPassword ? 'Verbergen' : 'Anzeigen'

    el.innerHTML = `
      <div class="sc-auth-title">${isRegister ? 'Konto erstellen' : 'Willkommen'}</div>
      <div class="sc-auth-subtitle">
        ${isRegister ? 'Registriere dich um den Chat zu nutzen.' : 'Melde dich an um zu chatten.'}
      </div>
      <input class="sc-input" type="email" placeholder="E-Mail-Adresse" autocomplete="email" />
      <div class="sc-pw-wrap">
        <input class="sc-input sc-pw-input" type="${pwType}" placeholder="Passwort"
               autocomplete="${isRegister ? 'new-password' : 'current-password'}" />
        <button type="button" class="sc-pw-toggle">${toggleLabel}</button>
      </div>
      ${isRegister ? `
      <div class="sc-pw-wrap">
        <input class="sc-input sc-pw-input sc-pw-confirm" type="${pwType}" placeholder="Passwort bestätigen"
               autocomplete="new-password" />
        <button type="button" class="sc-pw-toggle sc-pw-toggle-confirm">${toggleLabel}</button>
      </div>
      ` : ''}
      <div class="sc-error" style="display:none"></div>
      <button class="sc-btn sc-btn-submit">
        ${isRegister ? 'Registrieren' : 'Anmelden'}
      </button>
      <div class="sc-divider">oder</div>
      <button class="sc-btn sc-btn--google sc-btn-google">
        ${ICONS.google} Mit Google anmelden
      </button>
      <div class="sc-auth-toggle">
        ${isRegister
          ? 'Bereits ein Konto? <button class="sc-toggle-btn">Anmelden</button>'
          : 'Noch kein Konto? <button class="sc-toggle-btn">Registrieren</button>'
        }
      </div>
    `

    // Event-Listener setzen
    const emailInput = el.querySelector('input[type="email"]')
    const passwordInput = el.querySelector('.sc-pw-input')
    const confirmInput = el.querySelector('.sc-pw-confirm')
    const errorEl = el.querySelector('.sc-error')
    const submitBtn = el.querySelector('.sc-btn-submit')
    const googleBtn = el.querySelector('.sc-btn-google')
    const toggleBtn = el.querySelector('.sc-toggle-btn')

    // Passwort anzeigen/verbergen
    el.querySelectorAll('.sc-pw-toggle').forEach((btn) => {
      btn.addEventListener('click', () => {
        showPassword = !showPassword
        render()
      })
    })

    /** Zeigt eine Fehlermeldung an */
    function showError(msg) {
      errorEl.textContent = msg
      errorEl.style.display = 'block'
    }

    submitBtn.addEventListener('click', async () => {
      const email = emailInput.value.trim()
      const password = passwordInput.value
      errorEl.style.display = 'none'

      if (!email || !password) {
        showError('Bitte E-Mail und Passwort eingeben.')
        return
      }

      if (isRegister && confirmInput && password !== confirmInput.value) {
        showError('Passwörter stimmen nicht überein.')
        return
      }

      submitBtn.disabled = true
      submitBtn.textContent = '...'
      try {
        await onEmailAuth(email, password, isRegister)
      } catch (err) {
        showError(translateAuthError(err.code))
        submitBtn.disabled = false
        submitBtn.textContent = isRegister ? 'Registrieren' : 'Anmelden'
      }
    })

    // Enter-Taste im letzten Passwortfeld = Absenden
    const lastPwInput = confirmInput || passwordInput
    lastPwInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitBtn.click()
    })

    googleBtn.addEventListener('click', async () => {
      googleBtn.disabled = true
      try {
        await onGoogle()
      } catch (err) {
        showError(translateAuthError(err.code))
        googleBtn.disabled = false
      }
    })

    toggleBtn.addEventListener('click', () => {
      isRegister = !isRegister
      render()
    })
  }

  render()
  return el
}

/**
 * Rendert den Chat-Bereich mit Nachrichten-Liste und Eingabefeld.
 *
 * @param {object} options
 * @param {Function} options.onSend - Callback: (text: string) => void
 * @param {Function} options.onLogout - Callback für Logout
 * @returns {{ el: HTMLElement, messageList: HTMLElement, appendMessage: Function }}
 */
export function renderChatView({ onSend, onLogout }) {
  const el = document.createElement('div')
  el.style.cssText = 'display:flex; flex-direction:column; flex:1; overflow:hidden;'

  // Nachrichten-Liste
  const messageList = document.createElement('div')
  messageList.className = 'sc-messages'

  // Eingabebereich
  const inputArea = document.createElement('div')
  inputArea.className = 'sc-input-area'

  const textarea = document.createElement('textarea')
  textarea.className = 'sc-textarea'
  textarea.placeholder = 'Nachricht schreiben...'
  textarea.rows = 1

  // Textarea automatisch in der Höhe anpassen
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  })

  const sendBtn = document.createElement('button')
  sendBtn.className = 'sc-send-btn'
  sendBtn.setAttribute('aria-label', 'Senden')
  sendBtn.innerHTML = ICONS.send
  sendBtn.disabled = true

  // Sende-Button nur aktiv wenn Text vorhanden
  textarea.addEventListener('input', () => {
    sendBtn.disabled = textarea.value.trim().length === 0
  })

  function sendMessage() {
    const text = textarea.value.trim()
    if (!text) return
    textarea.value = ''
    textarea.style.height = 'auto'
    sendBtn.disabled = true
    onSend(text)
  }

  sendBtn.addEventListener('click', sendMessage)

  // Strg+Enter oder Enter sendet (Shift+Enter = Zeilenumbruch)
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  })

  inputArea.appendChild(textarea)
  inputArea.appendChild(sendBtn)

  // Footer mit Logout-Button
  const footer = document.createElement('div')
  footer.className = 'sc-footer'
  const logoutBtn = document.createElement('button')
  logoutBtn.className = 'sc-logout-btn'
  logoutBtn.textContent = 'Abmelden'
  logoutBtn.addEventListener('click', onLogout)
  footer.appendChild(logoutBtn)

  el.appendChild(messageList)
  el.appendChild(inputArea)
  el.appendChild(footer)

  return {
    el,
    messageList,

    /**
     * Fügt eine neue Nachricht zur Liste hinzu.
     * @param {{ text: string, senderRole: 'user'|'admin', createdAt: Date }} message
     * @param {boolean} scrollToBottom - Ob nach unten gescrollt werden soll
     */
    appendMessage(message, scrollToBottom = true) {
      // Platzhalter entfernen wenn vorhanden
      const empty = messageList.querySelector('.sc-empty')
      if (empty) empty.remove()

      const msgEl = document.createElement('div')
      msgEl.className = `sc-message sc-message--${message.senderRole}`

      const bubble = document.createElement('div')
      bubble.className = 'sc-message-bubble'
      bubble.textContent = message.text

      const time = document.createElement('div')
      time.className = 'sc-message-time'
      time.textContent = formatTime(message.createdAt)

      msgEl.appendChild(bubble)
      msgEl.appendChild(time)
      messageList.appendChild(msgEl)

      if (scrollToBottom) {
        messageList.scrollTop = messageList.scrollHeight
      }
    },
  }
}

/**
 * Rendert einen Lade-Indikator.
 * @returns {HTMLElement}
 */
export function renderLoadingView() {
  const el = document.createElement('div')
  el.className = 'sc-loading'
  el.innerHTML = '<div class="sc-spinner"></div>'
  return el
}

/**
 * Rendert einen Hinweis für leere Konversationen.
 * @param {string} greeting - Begrüßungstext
 * @returns {HTMLElement}
 */
export function renderEmptyView(greeting) {
  const el = document.createElement('div')
  el.className = 'sc-empty'
  el.innerHTML = `
    <div style="font-size:24px">💬</div>
    <div>${escapeHtml(greeting)}</div>
    <div style="font-size:12px;opacity:0.7">Schreib uns — wir antworten so schnell wie möglich.</div>
  `
  return el
}

// ─── Hilfsfunktionen ───────────────────────────────────────────────────────────

/**
 * Setzt eine CSS Custom Property auf dem Shadow-Host (für Tenant-Branding).
 * @param {string} name - z.B. '--sc-primary'
 * @param {string} value - z.B. '#0066cc'
 */
export function setCssVar(name, value) {
  if (!shadowRoot) return
  const host = shadowRoot.host
  host.style.setProperty(name, value)
}

/**
 * Setzt das aktive Theme auf dem Shadow-Host.
 * Entfernt alle vorhandenen sc-theme-* Klassen und fügt die neue hinzu.
 * @param {string} themeId - z.B. 'default'
 */
export function setTheme(themeId) {
  if (!shadowRoot) return
  const host = shadowRoot.host
  const filtered = host.className
    .split(' ')
    .filter(c => !c.startsWith('sc-theme-'))
  filtered.push(`sc-theme-${themeId}`)
  host.className = filtered.join(' ').trim()
}

/**
 * Escaped HTML-Sonderzeichen um XSS zu verhindern.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// translateAuthError und formatTime kommen aus @support-chat/shared
