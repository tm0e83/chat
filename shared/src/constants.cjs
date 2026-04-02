/**
 * CommonJS-Version der Konstanten für Firebase Cloud Functions.
 * Functions nutzen require() statt import, daher diese separate Datei.
 */
const COLLECTIONS = {
  TENANTS: 'tenants',
  INVITES: 'invites',
  CONVERSATIONS: 'conversations',
  MESSAGES: 'messages',
}

const ROLES = {
  SUPER_ADMIN: 'superadmin',
  ADMIN: 'admin',
}

const CONVERSATION_STATUS = {
  OPEN: 'open',
  RESOLVED: 'resolved',
  ALL: 'all',
}

const SENDER_ROLE = {
  USER: 'user',
  ADMIN: 'admin',
}

const TENANT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
}

const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

const STORAGE_KEYS = {
  CONSENT_GIVEN: 'sc_consent',
}

module.exports = {
  COLLECTIONS,
  ROLES,
  CONVERSATION_STATUS,
  SENDER_ROLE,
  TENANT_STATUS,
  INVITE_EXPIRY_MS,
  STORAGE_KEYS,
}
