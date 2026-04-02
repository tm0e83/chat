/**
 * disableUser — Nutzer-Konto sperren.
 * Der Nutzer kann sich nicht mehr einloggen, Daten bleiben erhalten.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { getAuth } = require('firebase-admin/auth')
const { assertAdminOf } = require('../helpers')

exports.disableUser = onCall(
  { region: 'europe-west3', cors: true, invoker: 'public' },
  async (request) => {
    const { uid, tenantId } = request.data

    if (!uid || !tenantId) {
      throw new HttpsError('invalid-argument', 'uid und tenantId sind erforderlich.')
    }

    assertAdminOf(request.auth, tenantId)

    await getAuth().updateUser(uid, { disabled: true })
    await getAuth().revokeRefreshTokens(uid)

    return { success: true, uid }
  },
)
