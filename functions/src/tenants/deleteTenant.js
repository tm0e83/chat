/**
 * deleteTenant — Tenant dauerhaft löschen.
 *
 * Löscht in dieser Reihenfolge:
 * 1. Alle Nachrichten aller Konversationen des Tenants
 * 2. Alle Konversations-Dokumente des Tenants
 * 3. Das Tenant-Dokument selbst
 *
 * Firebase Auth-Nutzer des Tenants werden NICHT gelöscht
 * (sie könnten Konten bei anderen Tenants haben oder sich neu registrieren).
 * Separate deleteUser-Aufrufe sind nötig wenn Nutzer ebenfalls entfernt werden sollen.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { getFirestore } = require('firebase-admin/firestore')
const { assertSuperAdmin, deleteCollection } = require('../helpers')
const { COLLECTIONS } = require('../constants.cjs')

exports.deleteTenant = onCall(
  { region: 'europe-west3', cors: true, invoker: 'public' },
  async (request) => {
    const { tenantId } = request.data

    if (!tenantId) {
      throw new HttpsError('invalid-argument', 'tenantId ist erforderlich.')
    }

    assertSuperAdmin(request.auth)

    const db = getFirestore()

    // ── 1. Alle Konversationen des Tenants laden
    const conversationsSnap = await db
      .collection(COLLECTIONS.CONVERSATIONS)
      .where('tenantId', '==', tenantId)
      .get()

    // ── 2. Für jede Konversation: Nachrichten-Subcollection + Dokument parallel löschen
    await Promise.all(
      conversationsSnap.docs.map(async (convDoc) => {
        await deleteCollection(db, convDoc.ref.collection(COLLECTIONS.MESSAGES))
        await convDoc.ref.delete()
      }),
    )

    // ── 3. Tenant-Dokument löschen
    await db.collection(COLLECTIONS.TENANTS).doc(tenantId).delete()

    return {
      success: true,
      deletedConversations: conversationsSnap.size,
    }
  },
)
