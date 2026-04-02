/**
 * deleteConversation — Konversation dauerhaft löschen.
 *
 * Löscht zuerst alle Nachrichten in der Subcollection (Batch-Delete),
 * dann das Konversations-Dokument selbst.
 * Firestore würde das Parent-Dokument ohne die Subcollection löschen,
 * was "verwaiste" Nachrichten hinterlassen würde.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { getFirestore } = require('firebase-admin/firestore')
const { assertAdminOf, deleteCollection } = require('../helpers')
const { COLLECTIONS } = require('../constants.cjs')

exports.deleteConversation = onCall(
  { region: 'europe-west3', cors: true, invoker: 'public' },
  async (request) => {
    const { conversationId } = request.data

    if (!conversationId) {
      throw new HttpsError('invalid-argument', 'conversationId ist erforderlich.')
    }

    // tenantId aus der Konversations-ID extrahieren (Format: tenantId_userId)
    const tenantId = conversationId.split('_')[0]
    assertAdminOf(request.auth, tenantId)

    const db = getFirestore()
    const conversationRef = db.collection(COLLECTIONS.CONVERSATIONS).doc(conversationId)

    // Konversation existiert prüfen
    const snap = await conversationRef.get()
    if (!snap.exists) {
      throw new HttpsError('not-found', `Konversation "${conversationId}" nicht gefunden.`)
    }

    // ── 1. Nachrichten-Subcollection löschen
    const messagesRef = conversationRef.collection(COLLECTIONS.MESSAGES)
    const deletedCount = await deleteCollection(db, messagesRef)

    // ── 2. Konversations-Dokument löschen
    await conversationRef.delete()

    return { success: true, deletedMessages: deletedCount }
  },
)
