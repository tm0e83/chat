/**
 * useAuth Hook — Auth-Status und Rollen-Informationen.
 *
 * Gibt den eingeloggten Nutzer, seine Rolle und tenantId zurück.
 * Prüft den Firebase Custom Claim beim Login und nach Token-Refresh.
 *
 * Rückgabe:
 *   user      → Firebase User-Objekt oder null
 *   role      → 'superadmin' | 'admin' | null
 *   tenantId  → Tenant-ID aus dem Custom Claim (nur für Tenant-Admins)
 *   loading   → true während der initiale Auth-Status geladen wird
 */
import { useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase.js'
import { ROLES } from '@support-chat/shared'

/**
 * @typedef {object} AuthState
 * @property {import('firebase/auth').User|null} user
 * @property {'superadmin'|'admin'|null} role
 * @property {string|null} tenantId
 * @property {boolean} loading
 */

/**
 * @returns {AuthState}
 */
export function useAuth() {
  const [state, setState] = useState({
    user: null,
    role: null,
    tenantId: null,
    loading: true,
  })

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, role: null, tenantId: null, loading: false })
        return
      }

      try {
        // Custom Claims aus dem ID-Token lesen.
        // forceRefresh: true stellt sicher dass wir aktuelle Claims haben
        // (relevant wenn Claims gerade erst gesetzt wurden)
        const token = await user.getIdTokenResult(/* forceRefresh */ false)
        const claims = token.claims

        const role = claims.role === ROLES.SUPER_ADMIN
          ? ROLES.SUPER_ADMIN
          : claims.role === ROLES.ADMIN
            ? ROLES.ADMIN
            : null

        setState({
          user,
          role,
          tenantId: claims.tenantId || null,
          loading: false,
        })
      } catch (err) {
        console.error('[Admin] Fehler beim Lesen der Custom Claims:', err)
        setState({ user, role: null, tenantId: null, loading: false })
      }
    })

    return unsubscribe
  }, [])

  return state
}
