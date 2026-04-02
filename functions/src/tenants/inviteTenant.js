/**
 * inviteTenant — Neuen Tenant per E-Mail einladen.
 *
 * Erstellt ein Einladungs-Dokument in Firestore und sendet eine E-Mail.
 * Für den E-Mail-Versand wird Firebase Trigger Email Extension oder
 * ein einfacher nodemailer-Aufruf empfohlen.
 *
 * In dieser Version wird die Einladungs-URL geloggt — E-Mail-Integration
 * muss separat konfiguriert werden.
 */
const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { getFirestore, Timestamp } = require('firebase-admin/firestore')
const { assertSuperAdmin } = require('../helpers')
const { INVITE_EXPIRY_MS, COLLECTIONS, ROLES } = require('../constants.cjs')

exports.inviteTenant = onCall(
  { region: 'europe-west3', cors: true, invoker: 'public' },
  async (request) => {
    const { email } = request.data

    if (!email) {
      throw new HttpsError('invalid-argument', 'E-Mail-Adresse ist erforderlich.')
    }

    assertSuperAdmin(request.auth)

    const db = getFirestore()

    // Einladungs-Dokument erstellen (7 Tage gültig)
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS)

    const inviteRef = await db.collection(COLLECTIONS.INVITES).add({
      email,
      tenantId: null, // Wird beim Akzeptieren gesetzt
      role: ROLES.ADMIN,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(expiresAt),
      usedAt: null,
    })

    const adminBaseUrl = process.env.ADMIN_BASE_URL || 'https://DEINE-ADMIN-DOMAIN.de'
    const inviteUrl = `${adminBaseUrl}/invite/${inviteRef.id}`

    // TODO: E-Mail senden (Firebase Trigger Email Extension oder nodemailer)
    // Vorerst: URL in Logs (nur im Development/Emulator sichtbar)
    console.info(`[inviteTenant] Einladungs-URL für ${email}: ${inviteUrl}`)

    return {
      success: true,
      inviteId: inviteRef.id,
      // URL wird zurückgegeben damit das Admin-Dashboard sie anzeigen kann
      inviteUrl,
    }
  },
)
