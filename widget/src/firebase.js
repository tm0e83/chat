/**
 * Firebase-Initialisierung für das Widget.
 *
 * Die Firebase-Konfiguration wird aus Umgebungsvariablen geladen,
 * die Vite beim Build-Prozess inline einbettet (import.meta.env.VITE_*).
 * Die Werte stammen aus der .env-Datei im Projekt-Root.
 *
 * WICHTIG: Die Firebase-Konfiguration ist technisch gesehen öffentlich
 * (sie ist im JavaScript-Bundle sichtbar). Die Sicherheit liegt ausschließlich
 * in den Firestore Security Rules — niemals in der Geheimhaltung der Config.
 */
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Verhindert doppelte Initialisierung (z.B. beim Hot-Reload in der Entwicklung)
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0]

/** Firestore-Datenbankinstanz */
export const db = getFirestore(app)

/** Firebase Auth-Instanz */
export const auth = getAuth(app)
