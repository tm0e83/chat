/**
 * inviteTenantAdmin — Weiteren Admin zu einem bestehenden Tenant einladen.
 * Kann von Super-Admin oder bestehendem Tenant-Admin aufgerufen werden.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { getFirestore, Timestamp } = require('firebase-admin/firestore')
const { assertAdminOf } = require('../helpers')
const { INVITE_EXPIRY_MS, COLLECTIONS, ROLES } = require('../constants.cjs')

exports.inviteTenantAdmin = onCall(
  { region: 'europe-west3', cors: true, invoker: 'public' },
  async (request) => {
    const { email, tenantId } = request.data

    if (!email || !tenantId) {
      throw new HttpsError('invalid-argument', 'email und tenantId sind erforderlich.')
    }

    assertAdminOf(request.auth, tenantId)

    const db = getFirestore()
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS)

    const inviteRef = await db.collection(COLLECTIONS.INVITES).add({
      email,
      tenantId, // Bereits bekannt — kein neuer Tenant wird erstellt
      role: ROLES.ADMIN,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      usedAt: null,
    })

    const adminBaseUrl = process.env.ADMIN_BASE_URL || 'https://DEINE-ADMIN-DOMAIN.de'
    const inviteUrl = `${adminBaseUrl}/invite/${inviteRef.id}`
    console.info(`[inviteTenantAdmin] Einladungs-URL für ${email}: ${inviteUrl}`)

    return { success: true, inviteId: inviteRef.id, inviteUrl }
  },
)
