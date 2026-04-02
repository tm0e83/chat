/**
 * searchMessages — Volltext-Suche in Nachrichten einer Konversation.
 *
 * Da Firestore keine native Volltext-Suche unterstützt, werden alle Nachrichten
 * einer Konversation geladen und serverseitig gefiltert.
 *
 * Annahme: Eine Support-Chat-Konversation hat typischerweise wenige hundert
 * Nachrichten — das In-Memory-Filtern ist für diese Volumina ausreichend schnell.
 * Bei sehr hohen Volumina wäre Algolia oder Typesense die bessere Wahl.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { getFirestore } = require('firebase-admin/firestore')
const { assertAdminOf } = require('../helpers')
const { COLLECTIONS } = require('../constants.cjs')

exports.searchMessages = onCall(
  { region: 'europe-west3', cors: true, invoker: 'public' },
  async (request) => {
    const { conversationId, keyword } = request.data

    if (!conversationId || !keyword) {
      throw new HttpsError('invalid-argument', 'conversationId und keyword sind erforderlich.')
    }

    if (keyword.length < 2) {
      throw new HttpsError('invalid-argument', 'Suchbegriff muss mindestens 2 Zeichen haben.')
    }

    const tenantId = conversationId.split('_')[0]
    assertAdminOf(request.auth, tenantId)

    const db = getFirestore()
    const messagesRef = db
      .collection(COLLECTIONS.CONVERSATIONS)
      .doc(conversationId)
      .collection(COLLECTIONS.MESSAGES)
      .orderBy('createdAt', 'asc')

    const snapshot = await messagesRef.get()

    // Case-insensitiver Substring-Vergleich
    const searchTerm = keyword.toLowerCase()
    const matches = snapshot.docs
      .filter((doc) => {
        const text = doc.data().text || ''
        return text.toLowerCase().includes(searchTerm)
      })
      .map((doc) => ({
        id: doc.id,
        text: doc.data().text,
        senderRole: doc.data().senderRole,
        createdAt: doc.data().createdAt?.toDate()?.toISOString() || null,
      }))

    return { matches, totalChecked: snapshot.size }
  },
)
