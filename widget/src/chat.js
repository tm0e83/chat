/**
 * Chat-Modul des Support-Chat-Widgets.
 *
 * Verantwortlich für alle Firestore-Operationen:
 * - Konversation laden oder erstellen (deterministischer ID: tenantId_userId)
 * - Nachrichten senden (Nutzer → Admin)
 * - Echtzeit-Updates empfangen (onSnapshot)
 * - Tenant-Konfiguration laden (Domains, Branding)
 */
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
} from 'firebase/firestore'
import { db } from './firebase.js'
import { COLLECTIONS, SENDER_ROLE } from '@support-chat/shared'

// ─── Tenant ────────────────────────────────────────────────────────────────────

/**
 * Lädt die Tenant-Konfiguration aus Firestore.
 * Enthält erlaubte Domains, Branding (Farben, Begrüßungstext) und Status.
 *
 * @param {string} tenantId
 * @returns {Promise<object|null>} Tenant-Daten oder null wenn nicht gefunden
 */
export async function loadTenant(tenantId) {
  const ref = doc(db, COLLECTIONS.TENANTS, tenantId)
  const snap = await getDoc(ref)
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

// ─── Konversation ──────────────────────────────────────────────────────────────

/**
 * Gibt die Konversation des Nutzers zurück oder erstellt sie beim ersten Chat.
 *
 * Die Konversations-ID ist deterministisch: "{tenantId}_{userId}"
 * Das ermöglicht einen direkten doc()-Zugriff ohne vorherige Query.
 *
 * @param {string} tenantId
 * @param {import('firebase/auth').User} user - Eingeloggter Nutzer
 * @param {string} domain - Aktuelle Domain (z.B. "example.com")
 * @returns {Promise<string>} Die Konversations-ID
 */
export async function getOrCreateConversation(tenantId, user, domain) {
  const conversationId = buildConversationId(tenantId, user.uid)
  const ref = doc(db, COLLECTIONS.CONVERSATIONS, conversationId)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    // Neue Konversation anlegen
    // Das `domain`-Feld wird von der Firestore Security Rule gegen die Whitelist geprüft
    await setDoc(ref, {
      tenantId,
      userId: user.uid,
      userEmail: user.email || '',
      displayName: user.displayName || user.email?.split('@')[0] || 'Nutzer',
      domain,
      unreadByAdmin: 0,
      lastMessage: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  return conversationId
}

/**
 * Sendet eine Nachricht des Nutzers an den Admin.
 *
 * Schreibt die Nachricht in die messages-Subcollection und
 * aktualisiert das Konversations-Dokument (Vorschau, Zeitstempel, Unread-Counter).
 *
 * @param {string} conversationId
 * @param {string} text - Nachrichtentext
 * @param {string} userId - UID des sendenden Nutzers
 * @returns {Promise<void>}
 */
export async function sendMessage(conversationId, text, userId) {
  const messagesRef = collection(
    db,
    COLLECTIONS.CONVERSATIONS,
    conversationId,
    COLLECTIONS.MESSAGES,
  )
  const conversationRef = doc(db, COLLECTIONS.CONVERSATIONS, conversationId)

  // Nachricht in Subcollection schreiben
  await addDoc(messagesRef, {
    text,
    senderId: userId,
    senderRole: SENDER_ROLE.USER,
    createdAt: serverTimestamp(),
    read: false,
  })

  // Konversations-Metadaten aktualisieren:
  // - increment(1) ist atomar und verhindert Race Conditions
  // - updatedAt wird für die Sortierung im Admin-Dashboard verwendet
  await setDoc(conversationRef, {
    lastMessage: text.length > 80 ? text.slice(0, 80) + '…' : text,
    updatedAt: serverTimestamp(),
    unreadByAdmin: increment(1),
  }, { merge: true })
}

/**
 * Abonniert Nachrichten einer Konversation in Echtzeit.
 * Der Callback wird sofort mit bestehenden Nachrichten und bei jeder Änderung aufgerufen.
 *
 * @param {string} conversationId
 * @param {(messages: Array) => void} callback
 * @returns {Function} Unsubscribe-Funktion (aufrufen um das Abo zu beenden)
 */
export function subscribeToMessages(conversationId, callback) {
  const messagesRef = collection(
    db,
    COLLECTIONS.CONVERSATIONS,
    conversationId,
    COLLECTIONS.MESSAGES,
  )

  // Nachrichten chronologisch sortiert
  const q = query(messagesRef, orderBy('createdAt', 'asc'))

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))
    callback(messages)
  }, (error) => {
    console.error('[SupportChat] Fehler beim Empfangen von Nachrichten:', error)
  })
}

// ─── Hilfsfunktionen ───────────────────────────────────────────────────────────

/**
 * Baut die deterministische Konversations-ID zusammen.
 * Format: "{tenantId}_{userId}"
 *
 * @param {string} tenantId
 * @param {string} userId
 * @returns {string}
 */
export function buildConversationId(tenantId, userId) {
  return `${tenantId}_${userId}`
}

/**
 * Prüft ob die aktuelle Domain in der Tenant-Whitelist erlaubt ist.
 *
 * Dies ist die clientseitige Prüfung. Die serverseitige Prüfung erfolgt
 * zusätzlich in den Firestore Security Rules (Zwei-Schicht-Schutz).
 *
 * @param {string[]} allowedDomains - Liste der erlaubten Domains
 * @param {string} currentHostname - z.B. "example.com"
 * @returns {boolean}
 */
export function isDomainAllowed(allowedDomains, currentHostname) {
  return Array.isArray(allowedDomains) && allowedDomains.includes(currentHostname)
}
