/**
 * Initialisierungs-Modul des Support-Chat-Widgets.
 *
 * Orchestriert den gesamten Widget-Lifecycle:
 * 1. Konfiguration aus data-Attributen lesen
 * 2. Tenant laden und Domain-Check durchführen
 * 3. DSGVO-Consent prüfen
 * 4. Shadow DOM erstellen
 * 5. Auth-Status überwachen und UI entsprechend rendern
 *
 * Dieses Modul ist der zentrale Einstiegspunkt nach dem Entry-Point (index.js).
 */
import { STORAGE_KEYS, DEFAULT_THEME } from '@support-chat/shared'
import { onAuthChange, signInWithEmail, signInWithGoogle, logout } from './auth.js'
import { loadTenant, getOrCreateConversation, sendMessage, subscribeToMessages, isDomainAllowed } from './chat.js'
import {
  createShadowRoot,
  renderTriggerButton,
  renderConsentView,
  renderAuthView,
  renderChatView,
  renderLoadingView,
  renderEmptyView,
  createChatWindow,
  setWindowVisible,
  setTheme,
} from './ui.js'

/**
 * @typedef {object} WidgetConfig
 * @property {string} tenantId - ID des Tenants aus Firestore
 * @property {'floating'|'inline'} [mode='floating'] - Widget-Modus
 * @property {string|null} [target=null] - CSS-Selektor für Inline-Modus
 * @property {string} [primaryColor] - Überschreibt die Tenant-Primärfarbe
 * @property {string} [position='bottom-right'] - Position des Floating-Buttons
 */

/**
 * Initialisiert das Support-Chat-Widget.
 * Wird von index.js aufgerufen, entweder automatisch oder manuell via SupportChat.init().
 *
 * @param {WidgetConfig} config
 */
export async function init(config) {
  const { tenantId, mode = 'floating', target = null } = config

  // ── 1. Tenant laden (enthält erlaubte Domains und Branding)
  let tenant
  try {
    tenant = await loadTenant(tenantId)
  } catch (err) {
    console.error('[SupportChat] Tenant konnte nicht geladen werden:', err)
    return
  }

  if (!tenant) {
    console.warn(`[SupportChat] Tenant "${tenantId}" nicht gefunden.`)
    return
  }

  if (tenant.status === 'suspended') {
    console.warn(`[SupportChat] Tenant "${tenantId}" ist gesperrt.`)
    return
  }

  // ── 2. Domain-Check (clientseitig)
  const currentHostname = window.location.hostname

  // localhost immer erlauben (für Entwicklung und Tests)
  const isLocalhost = currentHostname === 'localhost' || currentHostname === '127.0.0.1'
  if (!isLocalhost && !isDomainAllowed(tenant.domains || [], currentHostname)) {
    console.warn(
      `[SupportChat] Domain "${currentHostname}" ist für Tenant "${tenantId}" nicht freigegeben.`,
      'Erlaubte Domains:', tenant.domains,
    )
    return
  }

  // ── 3. Shadow DOM erstellen
  const shadowRoot = createShadowRoot(mode, target)

  // Theme anwenden (aus Tenant-Branding oder Fallback auf Standard-Theme)
  setTheme(tenant.branding?.theme || DEFAULT_THEME)

  // Fenster-Titel und Begrüßungstext
  const title = tenant.branding?.title || 'Support'
  const subtitle = tenant.branding?.subtitle || ''
  const greeting = tenant.branding?.greeting || 'Wie können wir helfen?'
  const privacyUrl = tenant.branding?.privacyUrl || ''

  // ── 4. Floating-Button erstellen (nur im Floating-Modus)
  let triggerBtn = null
  if (mode === 'floating') {
    triggerBtn = renderTriggerButton(() => {
      setWindowVisible(true)
    })
  }

  // ── 5. Chat-Fenster erstellen
  const chatWindow = createChatWindow({
    title,
    subtitle,
    mode,
    onClose: mode === 'floating' ? () => setWindowVisible(false) : null,
  })

  // Im Floating-Modus initial ausgeblendet
  if (mode === 'floating') {
    setWindowVisible(false)
  }

  // Aktuellen Inhalt des Fensters
  let currentContent = null

  /** Ersetzt den aktuellen Fenster-Inhalt */
  function setContent(el) {
    if (currentContent) currentContent.remove()
    currentContent = el
    chatWindow.appendChild(el)
  }

  // Aktives Konversations-Abo (wird bei Logout beendet)
  let unsubscribeMessages = null
  let unsubscribeAuth = null
  let currentConversationId = null

  // ── 6. DSGVO-Consent prüfen
  const hasConsent = localStorage.getItem(STORAGE_KEYS.CONSENT_GIVEN) === '1'

  if (!hasConsent) {
    // Consent-Banner anzeigen
    const consentView = renderConsentView({
      privacyUrl,
      onAccept: () => {
        localStorage.setItem(STORAGE_KEYS.CONSENT_GIVEN, '1')
        // Nach Zustimmung Auth-Formular anzeigen
        showAuthOrChat()
      },
    })
    setContent(consentView)
  } else {
    // Direkt zu Auth/Chat
    showAuthOrChat()
  }

  /**
   * Zeigt je nach Auth-Status Anmeldeformular oder Chat-Ansicht.
   * Wird aufgerufen nach Consent-Bestätigung und beim Auth-State-Change.
   */
  function showAuthOrChat() {
    // Lade-Indikator zeigen während Auth-Status geprüft wird
    setContent(renderLoadingView())

    // Vorherigen Auth-Listener abmelden um Memory-Leaks zu vermeiden
    if (unsubscribeAuth) {
      unsubscribeAuth()
    }

    unsubscribeAuth = onAuthChange(async (user) => {
      // Aktives Abo beenden wenn Nutzer sich ausloggt
      if (unsubscribeMessages) {
        unsubscribeMessages()
        unsubscribeMessages = null
        currentConversationId = null
      }

      if (!user) {
        // Nicht eingeloggt → Auth-Formular zeigen
        setContent(renderAuthView({
          onEmailAuth: async (email, password, isRegister) => {
            await signInWithEmail(email, password, isRegister)
            // onAuthChange wird automatisch wieder aufgerufen
          },
          onGoogle: signInWithGoogle,
        }))
        return
      }

      // Eingeloggt → Konversation laden und Chat zeigen
      setContent(renderLoadingView())

      try {
        currentConversationId = await getOrCreateConversation(
          tenantId,
          user,
          currentHostname,
        )
      } catch (err) {
        console.error('[SupportChat] Konversation konnte nicht erstellt werden:', err)
        return
      }

      // Chat-Ansicht rendern
      const { el, messageList, appendMessage } = renderChatView({
        onSend: (text) => sendMessage(currentConversationId, text, user.uid),
        onLogout: logout,
      })

      // Begrüßungs-Platzhalter solange noch keine Nachrichten da sind
      messageList.appendChild(renderEmptyView(greeting))
      setContent(el)

      let firstLoad = true
      const renderedIds = new Set()

      // Echtzeit-Updates abonnieren
      unsubscribeMessages = subscribeToMessages(currentConversationId, (messages) => {
        if (messages.length === 0) return

        if (firstLoad) {
          // Alle bestehenden Nachrichten auf einmal laden (kein Scroll-Animation)
          messageList.innerHTML = ''
          messages.forEach((msg) => {
            appendMessage(msg, false)
            renderedIds.add(msg.id)
          })
          messageList.scrollTop = messageList.scrollHeight
          firstLoad = false
        } else {
          // Nur noch nicht gerenderte Nachrichten anhängen
          // (verhindert Duplikate durch optimistische Firestore-Updates)
          messages.forEach((msg) => {
            if (!renderedIds.has(msg.id)) {
              appendMessage(msg, true)
              renderedIds.add(msg.id)
            }
          })
        }
      })
    })
  }
}
