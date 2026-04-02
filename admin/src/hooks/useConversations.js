/**
 * useConversations Hook — Echtzeit-Liste aller Konversationen.
 *
 * Abonniert Firestore und gibt die Konversationen des Tenants zurück.
 * Super-Admins sehen alle Konversationen aller Tenants.
 * Tenant-Admins sehen nur Konversationen ihres eigenen Tenants.
 *
 * Optional: nach Status filtern (open/resolved) oder nach E-Mail suchen.
 */
import { useState, useEffect } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  limit,
} from 'firebase/firestore'
import { db } from '@/firebase.js'
import { COLLECTIONS, ROLES } from '@support-chat/shared'

/**
 * @typedef {object} ConversationsOptions
 * @property {string|null} tenantId - Tenant-ID (null für Super-Admin = alle)
 * @property {string} role - Rolle des Admins ('superadmin' | 'admin')
 * @property {string} [emailSearch=''] - E-Mail-Prefix-Suche
 */

/**
 * @param {ConversationsOptions} options
 * @returns {{ conversations: Array, loading: boolean, error: string|null }}
 */
export function useConversations({
  tenantId,
  role,
  emailSearch = '',
}) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Noch keine Auth-Infos → warten
    if (!role) return

    const ref = collection(db, COLLECTIONS.CONVERSATIONS)

    // Firestore-Query dynamisch aufbauen
    const constraints = []

    // Tenant-Filter: Tenant-Admins sehen nur ihre eigenen Konversationen
    if (role === ROLES.ADMIN && tenantId) {
      constraints.push(where('tenantId', '==', tenantId))
    }

    // E-Mail-Suche (Prefix-Match via Range Query)
    if (emailSearch.trim()) {
      const term = emailSearch.trim().toLowerCase()
      constraints.push(where('userEmail', '>=', term))
      constraints.push(where('userEmail', '<=', term + '\uf8ff'))
      // Bei E-Mail-Suche nach E-Mail sortieren (Firestore-Anforderung für Range Queries)
      constraints.push(orderBy('userEmail'))
    } else {
      // Standard: nach letzter Aktivität sortieren
      constraints.push(orderBy('updatedAt', 'desc'))
    }

    // Anzahl auf 100 begrenzen um Kosten zu kontrollieren
    constraints.push(limit(100))

    const q = query(ref, ...constraints)

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          // Firestore Timestamp → JS Date für einfachere Handhabung
          updatedAt: docSnap.data().updatedAt?.toDate?.() || null,
          createdAt: docSnap.data().createdAt?.toDate?.() || null,
        }))
        setConversations(docs)
        setLoading(false)
      },
      (err) => {
        console.error('[Admin] Fehler beim Laden der Konversationen:', err)
        setError('Konversationen konnten nicht geladen werden.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [tenantId, role, emailSearch])

  return { conversations, loading, error }
}
