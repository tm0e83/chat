/**
 * Datums- und Zeitformatierungen für Widget und Admin.
 * Zentralisiert um konsistente Formatierung sicherzustellen.
 */

/**
 * Formatiert einen Zeitstempel als Uhrzeit (HH:MM).
 * Unterstützt Firestore Timestamps (mit .toDate()), Date-Objekte und null.
 *
 * @param {Date|{toDate: Function}|null} timestamp
 * @returns {string}
 */
export function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = typeof timestamp.toDate === 'function'
    ? timestamp.toDate()
    : new Date(timestamp)
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Formatiert einen Zeitstempel als vollständiges Datum + Uhrzeit.
 * z.B. "01.04.2026, 14:30"
 *
 * @param {Date|null} date
 * @returns {string}
 */
export function formatDateTime(date) {
  if (!date) return '–'
  return new Date(date).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/**
 * Formatiert einen Zeitstempel als relatives Datum ("vor 5 Min.", "vor 2 Tagen").
 *
 * @param {Date|null} date
 * @returns {string}
 */
export function formatRelativeTime(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Gerade eben'
  if (minutes < 60) return `vor ${minutes} Min.`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `vor ${hours} Std.`
  const days = Math.floor(hours / 24)
  return `vor ${days} Tag${days > 1 ? 'en' : ''}`
}

/**
 * Formatiert einen Zeitstempel als Datum (DD.MM.YYYY).
 *
 * @param {Date|string|null} date
 * @returns {string}
 */
export function formatDate(date) {
  if (!date) return '–'
  return new Date(date).toLocaleDateString('de-DE')
}
