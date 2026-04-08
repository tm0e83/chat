/**
 * Gemeinsame Konstanten für Widget, Admin und Functions.
 * Zentrale Stelle für Collection-Namen, Rollen und andere feste Werte,
 * damit Tippfehler sofort auffallen und Änderungen nur an einer Stelle nötig sind.
 */

// ─── Firestore Collection-Namen ────────────────────────────────────────────────

export const COLLECTIONS = {
  /** Tenant-Konfiguration: Domains, Branding, Status */
  TENANTS: 'tenants',

  /** Einladungen für neue Tenants und Tenant-Admins */
  INVITES: 'invites',

  /**
   * Support-Konversationen.
   * Dokument-ID: {tenantId}_{userId} (deterministisch zusammengesetzt)
   */
  CONVERSATIONS: 'conversations',

  /** Nachrichten innerhalb einer Konversation (Subcollection) */
  MESSAGES: 'messages',
}

// ─── Rollen (Custom Claims) ────────────────────────────────────────────────────

export const ROLES = {
  /** Systemeigentümer — hat Zugriff auf alle Tenants */
  SUPER_ADMIN: 'superadmin',

  /** Tenant-Administrator — verwaltet einen einzelnen Tenant */
  ADMIN: 'admin',
}

// ─── Konversations-Status ──────────────────────────────────────────────────────

export const CONVERSATION_STATUS = {
  OPEN: 'open',
  RESOLVED: 'resolved',
  ALL: 'all',
}

// ─── Nachrichten-Rollen ────────────────────────────────────────────────────────

export const SENDER_ROLE = {
  USER: 'user',
  ADMIN: 'admin',
}

// ─── Tenant-Status ─────────────────────────────────────────────────────────────

export const TENANT_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
}

// ─── Einladungs-Gültigkeit ─────────────────────────────────────────────────────

/** Einladungen verfallen nach 7 Tagen (in Millisekunden) */
export const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000

// ─── Local Storage Keys ────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  /** Speichert ob der Nutzer dem DSGVO-Consent zugestimmt hat */
  CONSENT_GIVEN: 'sc_consent',
}

// ─── Widget-Themes ─────────────────────────────────────────────────────────────

/** Liste aller verfügbaren Widget-Themes (je mit id und Anzeigename) */
export const THEMES = [
  { id: 'default', name: 'Standard' },
]

/** ID des Standard-Themes, wird verwendet wenn kein Theme im Branding gesetzt ist */
export const DEFAULT_THEME = 'default'
