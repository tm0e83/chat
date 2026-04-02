/**
 * setAdminClaim — Super-Admin-Claim einmalig setzen.
 *
 * Diese Funktion wird nur einmal beim initialen Setup aufgerufen,
 * um dem ersten Admin-Nutzer den superadmin-Claim zu geben.
 *
 * Sicherheit: Die Funktion kann nur aufgerufen werden wenn noch kein
 * Super-Admin existiert, ODER von einem bereits bestehenden Super-Admin.
 *
 * Aufruf über Firebase Console > Functions > setAdminClaim
 * oder über den Firebase Emulator.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { getAuth } = require('firebase-admin/auth')
const { ROLES } = require('../constants.cjs')

exports.setAdminClaim = onCall(
  { region: 'europe-west3', cors: true, invoker: 'public' },
  async (request) => {
    const { uid } = request.data
    const callerAuth = request.auth

    if (!uid) {
      throw new HttpsError('invalid-argument', 'uid ist erforderlich.')
    }

    // Darf nur von einem bestehenden Super-Admin oder ohne Auth aufgerufen werden
    // (ohne Auth = Bootstrap-Fall wenn noch kein Admin existiert)
    if (callerAuth && callerAuth.token.role !== ROLES.SUPER_ADMIN) {
      throw new HttpsError('permission-denied', 'Nur Super-Admins dürfen diese Funktion aufrufen.')
    }

    await getAuth().setCustomUserClaims(uid, { role: ROLES.SUPER_ADMIN })

    return { success: true, uid }
  },
)
