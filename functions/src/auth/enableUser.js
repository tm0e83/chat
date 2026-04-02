/**
 * enableUser — Gesperrtes Nutzer-Konto wieder entsperren.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { getAuth } = require('firebase-admin/auth')
const { assertAdminOf } = require('../helpers')

exports.enableUser = onCall(
  { region: 'europe-west3', cors: true, invoker: 'public' },
  async (request) => {
    const { uid, tenantId } = request.data

    if (!uid || !tenantId) {
      throw new HttpsError('invalid-argument', 'uid und tenantId sind erforderlich.')
    }

    assertAdminOf(request.auth, tenantId)

    await getAuth().updateUser(uid, { disabled: false })

    return { success: true, uid }
  },
)
