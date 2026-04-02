/**
 * deleteUser — Nutzer dauerhaft löschen.
 *
 * Löscht in dieser Reihenfolge:
 * 1. Alle Nachrichten (messages-Subcollection) in der Konversation des Nutzers
 * 2. Das Konversations-Dokument selbst
 * 3. Den Firebase Auth-Eintrag
 *
 * Die Reihenfolge ist wichtig: Firestore löscht Subcollections nicht automatisch.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore } = require('firebase-admin/firestore')
const { assertAdminOf, deleteCollection } = require('../helpers')
const { COLLECTIONS } = require('../constants.cjs')

exports.deleteUser = onCall(
  { region: 'europe-west3', cors: true, invoker: 'public' },
  async (request) => {
    const { uid, tenantId } = request.data

    if (!uid || !tenantId) {
      throw new HttpsError('invalid-argument', 'uid und tenantId sind erforderlich.')
    }

    assertAdminOf(request.auth, tenantId)

    const db = getFirestore()

    // ── 1. Konversation des Nutzers finden (deterministischer Key: tenantId_userId)
    const conversationId = `${tenantId}_${uid}`
    const conversationRef = db.collection(COLLECTIONS.CONVERSATIONS).doc(conversationId)
    const conversationSnap = await conversationRef.get()

    if (conversationSnap.exists) {
      // ── 2. Alle Nachrichten in der Subcollection löschen
      const messagesRef = conversationRef.collection(COLLECTIONS.MESSAGES)
      await deleteCollection(db, messagesRef)

      // ── 3. Konversations-Dokument löschen
      await conversationRef.delete()
    }

    // ── 4. Firebase Auth-Eintrag löschen
    try {
      await getAuth().deleteUser(uid)
    } catch (err) {
      // Nutzer existiert möglicherweise nicht mehr in Auth (idempotent)
      if (err.code !== 'auth/user-not-found') throw err
    }

    return { success: true, uid }
  },
)
