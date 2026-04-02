/**
 * Gemeinsame Hilfsfunktionen für alle Cloud Functions.
 */
const { HttpsError } = require('firebase-functions/v2/https')
const { ROLES } = require('./constants.cjs')

/**
 * Prüft ob der Aufrufer Super-Admin ist.
 * Wirft einen permission-denied Fehler wenn nicht.
 *
 * @param {object} auth - context.auth aus der Cloud Function
 * @throws {HttpsError} wenn kein Super-Admin
 */
function assertSuperAdmin(auth) {
  if (!auth || auth.token.role !== ROLES.SUPER_ADMIN) {
    throw new HttpsError('permission-denied', 'Nur Super-Admins dürfen diese Aktion ausführen.')
  }
}

/**
 * Prüft ob der Aufrufer Admin des angegebenen Tenants oder Super-Admin ist.
 *
 * @param {object} auth - context.auth
 * @param {string} tenantId - Erwartete Tenant-ID
 * @throws {HttpsError} wenn keine Berechtigung
 */
function assertAdminOf(auth, tenantId) {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Nicht eingeloggt.')
  }
  const isSuperAdmin = auth.token.role === ROLES.SUPER_ADMIN
  const isTenantAdmin = auth.token.role === ROLES.ADMIN && auth.token.tenantId === tenantId
  if (!isSuperAdmin && !isTenantAdmin) {
    throw new HttpsError('permission-denied', 'Keine Berechtigung für diesen Tenant.')
  }
}

/**
 * Löscht eine Firestore-Subcollection in Batches.
 * Firestore löscht Subcollections nicht automatisch mit dem Parent-Dokument.
 *
 * @param {import('firebase-admin/firestore').Firestore} db
 * @param {import('firebase-admin/firestore').CollectionReference} collectionRef
 * @returns {Promise<number>} Anzahl gelöschter Dokumente
 */
async function deleteCollection(db, collectionRef) {
  const BATCH_SIZE = 499 // Firestore-Limit: 500 Operationen pro Batch
  let totalDeleted = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snapshot = await collectionRef.limit(BATCH_SIZE).get()
    if (snapshot.empty) break

    const batch = db.batch()
    snapshot.docs.forEach((doc) => batch.delete(doc.ref))
    await batch.commit()
    totalDeleted += snapshot.docs.length
  }

  return totalDeleted
}

module.exports = { assertSuperAdmin, assertAdminOf, deleteCollection }
