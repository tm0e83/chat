/**
 * listUsers — Paginierte Liste aller Auth-Nutzer eines Tenants.
 *
 * Firebase Auth speichert keine tenantId am Nutzer selbst — die Zuordnung
 * erfolgt über Firestore-Dokumente. Daher werden alle Auth-Nutzer geladen
 * und gegen die Konversations-Collection gefiltert.
 *
 * Für kleine bis mittlere Nutzermengen (<10.000) ist das performant genug.
 * Bei größeren Mengen wäre ein dediziertes users-Dokument pro Tenant sinnvoll.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore } = require('firebase-admin/firestore')
const { assertAdminOf } = require('../helpers')
const { COLLECTIONS } = require('../constants.cjs')

exports.listUsers = onCall(
  { region: 'europe-west3', cors: true, invoker: 'public' },
  async (request) => {
    const { tenantId } = request.data

    if (!tenantId) {
      throw new HttpsError('invalid-argument', 'tenantId ist erforderlich.')
    }

    assertAdminOf(request.auth, tenantId)

    // Alle Konversationen dieses Tenants laden — liefert die zugehörigen userIds
    const db = getFirestore()
    const conversationsSnap = await db
      .collection(COLLECTIONS.CONVERSATIONS)
      .where('tenantId', '==', tenantId)
      .get()

    const userIds = new Set(conversationsSnap.docs.map((doc) => doc.data().userId))

    if (userIds.size === 0) {
      return { users: [], nextPageToken: null }
    }

    // Auth-Daten laden — getUsers() erlaubt max. 100 UIDs pro Aufruf
    const uidList = [...userIds].map((uid) => ({ uid }))
    const chunks = []
    for (let i = 0; i < uidList.length; i += 100) {
      chunks.push(uidList.slice(i, i + 100))
    }

    const results = await Promise.all(chunks.map((chunk) => getAuth().getUsers(chunk)))
    const allUsers = results.flatMap((r) => r.users)

    return {
      users: allUsers.map((user) => ({
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        disabled: user.disabled,
        metadata: {
          creationTime: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime,
        },
      })),
      nextPageToken: null,
    }
  },
)
