/**
 * Firebase Auth-Fehlercodes → lesbare Fehlermeldungen.
 * Verwendet von Widget (auth-Formular) und Admin (Login-Seite).
 *
 * @param {string} code - Firebase-Fehlercode (z.B. 'auth/wrong-password')
 * @returns {string} Deutsche Fehlermeldung
 */
export function translateAuthError(code) {
  const messages = {
    'auth/user-not-found': 'Kein Konto mit dieser E-Mail-Adresse gefunden.',
    'auth/wrong-password': 'Falsches Passwort.',
    'auth/invalid-credential': 'E-Mail oder Passwort ist falsch.',
    'auth/email-already-in-use': 'Diese E-Mail-Adresse wird bereits verwendet.',
    'auth/weak-password': 'Das Passwort muss mindestens 6 Zeichen lang sein.',
    'auth/invalid-email': 'Ungültige E-Mail-Adresse.',
    'auth/popup-closed-by-user': 'Das Login-Fenster wurde geschlossen.',
    'auth/too-many-requests': 'Zu viele Versuche. Bitte versuche es später erneut.',
    'auth/network-request-failed': 'Netzwerkfehler. Bitte überprüfe deine Verbindung.',
    'auth/user-disabled': 'Dieses Konto wurde gesperrt. Bitte kontaktiere den Support.',
  }
  return messages[code] || 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.'
}
