/**
 * Auth-Modul des Support-Chat-Widgets.
 *
 * Kapselt alle Firebase Auth-Operationen:
 * - Login mit E-Mail/Passwort
 * - Login mit Google (Popup)
 * - Registrierung
 * - Logout
 * - Session-Persistenz (Nutzer bleibt auch nach Seitenreload eingeloggt)
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
} from 'firebase/auth'
import { auth } from './firebase.js'

/** Google Auth Provider — einmal erstellt und wiederverwendet */
const googleProvider = new GoogleAuthProvider()

// browserLocalPersistence ist der Standard für Web — kein expliziter setPersistence-Aufruf nötig

/**
 * Meldet den Nutzer mit E-Mail und Passwort an oder registriert ihn.
 *
 * @param {string} email
 * @param {string} password
 * @param {boolean} isRegister - true = Registrierung, false = Login
 * @returns {Promise<import('firebase/auth').UserCredential>}
 * @throws {import('firebase/auth').AuthError} Firebase Auth-Fehler (z.B. falsches Passwort)
 */
export async function signInWithEmail(email, password, isRegister) {
  if (isRegister) {
    return createUserWithEmailAndPassword(auth, email, password)
  }
  return signInWithEmailAndPassword(auth, email, password)
}

/**
 * Öffnet ein Google-Login-Popup.
 * Der Nutzer wählt sein Google-Konto und wird nach Bestätigung eingeloggt.
 *
 * @returns {Promise<import('firebase/auth').UserCredential>}
 * @throws {import('firebase/auth').AuthError}
 */
export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider)
}

/**
 * Meldet den aktuell eingeloggten Nutzer ab.
 * @returns {Promise<void>}
 */
export async function logout() {
  return signOut(auth)
}

/**
 * Gibt den aktuell eingeloggten Nutzer zurück (oder null).
 * @returns {import('firebase/auth').User|null}
 */
export function getCurrentUser() {
  return auth.currentUser
}

/**
 * Registriert einen Listener für Auth-Statusänderungen.
 * Wird bei Login, Logout und beim initialen Laden der Seite aufgerufen.
 *
 * @param {(user: import('firebase/auth').User|null) => void} callback
 * @returns {Function} Unsubscribe-Funktion
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback)
}
