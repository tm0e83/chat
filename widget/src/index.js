/**
 * Entry-Point des Support-Chat-Widgets.
 *
 * Dieses Modul wird von Vite als IIFE gebaut und exponiert `window.SupportChat`.
 * Es liest die Konfiguration aus dem data-Attributen des eigenen <script>-Tags
 * und ruft automatisch SupportChat.init() auf.
 *
 * Einbindung auf der Host-Seite:
 *
 *   <!-- Floating-Modus (Standard) -->
 *   <script src="https://chat.domain.com/widget.js" data-tenant-id="abc123" defer></script>
 *
 *   <!-- Inline-Modus (Chat direkt auf der Seite) -->
 *   <div id="chat"></div>
 *   <script src="https://chat.domain.com/widget.js" data-tenant-id="abc123"
 *           data-mode="inline" data-target="#chat" defer></script>
 *
 *   <!-- Manuelle Initialisierung (überschreibt data-Attribute) -->
 *   <script src="https://chat.domain.com/widget.js" data-tenant-id="abc123" defer></script>
 *   <script>
 *     window.addEventListener('SupportChatReady', () => {
 *       SupportChat.init({ primaryColor: '#0066cc' });
 *     });
 *   </script>
 */
import { init } from './init.js'

/**
 * Liest die Konfiguration aus den data-Attributen des eigenen <script>-Tags.
 * Funktioniert weil `document.currentScript` während der synchronen Ausführung gesetzt ist.
 *
 * @returns {{ tenantId: string, mode: string, target: string|null }}
 */
function readScriptConfig() {
  // document.currentScript ist gesetzt wenn das Script synchron ausgeführt wird
  const script = document.currentScript
    || document.querySelector('script[data-tenant-id]')

  return {
    tenantId: script?.dataset?.tenantId || '',
    mode: script?.dataset?.mode || 'floating',
    target: script?.dataset?.target || null,
  }
}

/** Öffentliche API des Widgets, zugänglich als window.SupportChat */
const SupportChat = {
  /**
   * Initialisiert das Widget.
   * Kann manuell aufgerufen werden, um die automatische Initialisierung zu überschreiben.
   *
   * @param {import('./init.js').WidgetConfig} [config] - Optionale Konfiguration
   */
  init(config = {}) {
    const scriptConfig = readScriptConfig()
    const mergedConfig = { ...scriptConfig, ...config }

    if (!mergedConfig.tenantId) {
      console.error('[SupportChat] Kein tenant-id angegeben. Bitte data-tenant-id setzen.')
      return
    }

    init(mergedConfig).catch(console.error)
  },
}

// Globale API exposieren
window.SupportChat = SupportChat

// Automatische Initialisierung wenn das Dokument fertig geladen ist
function autoInit() {
  const script = document.currentScript || document.querySelector('script[src*="widget.js"]')
  const scriptConfig = readScriptConfig()

  if (scriptConfig.tenantId) {
    // Event dispatchen damit manuelle Listener die API überschreiben können
    const event = new CustomEvent('SupportChatReady', { detail: SupportChat })
    window.dispatchEvent(event)

    // Kurze Verzögerung damit manuelle window.addEventListener('SupportChatReady') reagieren können
    setTimeout(() => {
      // data-attribute am Script-Tag statt globalem window-Flag — kein Namespace-Konflikt
      if (script && !script.dataset.initialized) {
        script.dataset.initialized = '1'
        SupportChat.init()
      }
    }, 0)
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit)
} else {
  autoInit()
}

export default SupportChat
