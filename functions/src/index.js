/**
 * Firebase Cloud Functions — Einstiegspunkt.
 *
 * Alle Funktionen sind als HTTPS Callable Functions implementiert.
 * Sie können nur von authentifizierten Nutzern mit der korrekten Rolle aufgerufen werden.
 *
 * Region: europe-west3 (Frankfurt) — DSGVO-konform, Daten bleiben in der EU.
 */
const { initializeApp } = require('firebase-admin/app')

// Firebase Admin SDK initialisieren (einmal für alle Functions)
initializeApp()

// ─── Auth-Management ─────────────────────────────────────────────────────────
const { listUsers } = require('./auth/listUsers')
const { disableUser } = require('./auth/disableUser')
const { enableUser } = require('./auth/enableUser')
const { deleteUser } = require('./auth/deleteUser')
const { setAdminClaim } = require('./auth/setAdminClaim')

// ─── Konversations-Management ─────────────────────────────────────────────────
const { deleteConversation } = require('./conversations/deleteConversation')
const { searchMessages } = require('./conversations/searchMessages')

// ─── Tenant-Management ────────────────────────────────────────────────────────
const { inviteTenant } = require('./tenants/inviteTenant')
const { acceptInvite } = require('./tenants/acceptInvite')
const { deleteTenant } = require('./tenants/deleteTenant')
const { inviteTenantAdmin } = require('./tenants/inviteTenantAdmin')

module.exports = {
  // Auth
  listUsers,
  disableUser,
  enableUser,
  deleteUser,
  setAdminClaim,

  // Konversationen
  deleteConversation,
  searchMessages,

  // Tenants
  inviteTenant,
  acceptInvite,
  deleteTenant,
  inviteTenantAdmin,
}
