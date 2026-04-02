/**
 * acceptInvite — Einladung annehmen und Tenant erstellen.
 *
 * Wird aufgerufen wenn ein eingeladener Nutzer den Einladungslink aufruft
 * und sich registriert/einloggt. Erstellt das Tenant-Dokument und setzt
 * den Admin-Custom-Claim auf den eingeloggten Nutzer.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore, Timestamp } = require('firebase-admin/firestore')
const { COLLECTIONS, ROLES, TENANT_STATUS } = require('../constants.cjs')

exports.acceptInvite = onCall(
  { region: 'europe-west3', cors: true, invoker: 'public' },
  async (request) => {
    const { inviteId } = request.data
    const callerAuth = request.auth

    if (!inviteId) {
      throw new HttpsError('invalid-argument', 'inviteId ist erforderlich.')
    }

    if (!callerAuth) {
      throw new HttpsError('unauthenticated', 'Einloggen erforderlich.')
    }

    const db = getFirestore()

    // ── 1. Einladung laden und validieren
    const inviteRef = db.collection(COLLECTIONS.INVITES).doc(inviteId)
    const inviteSnap = await inviteRef.get()

    if (!inviteSnap.exists) {
      throw new HttpsError('not-found', 'Einladung nicht gefunden.')
    }

    const invite = inviteSnap.data()

    // Bereits verwendet?
    if (invite.usedAt) {
      throw new HttpsError('already-exists', 'Diese Einladung wurde bereits verwendet.')
    }

    // Abgelaufen?
    if (invite.expiresAt.toDate() < new Date()) {
      throw new HttpsError('deadline-exceeded', 'Diese Einladung ist abgelaufen.')
    }

    // E-Mail stimmt überein?
    if (invite.email !== callerAuth.token.email) {
      throw new HttpsError('permission-denied', 'Diese Einladung gilt für eine andere E-Mail-Adresse.')
    }

    // ── 2. Tenant-Dokument erstellen
    const tenantRef = await db.collection(COLLECTIONS.TENANTS).add({
      name: '',
      ownerEmail: invite.email,
      status: TENANT_STATUS.ACTIVE,
      domains: [],
      branding: {
        primaryColor: '#2563eb',
        greeting: 'Wie können wir helfen?',
        privacyUrl: '',
      },
      createdAt: Timestamp.now(),
    })

    const tenantId = tenantRef.id

    // ── 3. Admin-Custom-Claim setzen
    await getAuth().setCustomUserClaims(callerAuth.uid, {
      role: ROLES.ADMIN,
      tenantId,
    })

    // ── 4. Einladung als verwendet markieren
    await inviteRef.update({
      usedAt: Timestamp.now(),
      tenantId,
    })

    return { success: true, tenantId }
  },
)
