/**
 * useUsers Hook — Nutzerliste via Cloud Function.
 *
 * Firebase Auth-Nutzerlisten können nicht direkt vom Client abgerufen werden
 * (nur über Admin SDK). Daher wird die listUsers-Cloud-Function aufgerufen.
 *
 * Unterstützt Paginierung via nextPageToken.
 */
import { useState, useCallback } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase.js'

const listUsersFunc = httpsCallable(functions, 'listUsers')

/**
 * @returns {{
 *   users: Array,
 *   loading: boolean,
 *   error: string|null,
 *   hasMore: boolean,
 *   loadUsers: (tenantId: string) => void,
 *   loadMore: () => void,
 * }}
 */
export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [nextPageToken, setNextPageToken] = useState(null)
  const [currentTenantId, setCurrentTenantId] = useState(null)

  /**
   * Lädt die erste Seite der Nutzerliste.
   * @param {string} tenantId
   */
  const loadUsers = useCallback(async (tenantId) => {
    setLoading(true)
    setError(null)
    setUsers([])
    setNextPageToken(null)
    setCurrentTenantId(tenantId)

    try {
      const result = await listUsersFunc({ tenantId })
      setUsers(result.data.users || [])
      setNextPageToken(result.data.nextPageToken || null)
    } catch (err) {
      console.error('[Admin] Fehler beim Laden der Nutzer:', err)
      setError('Nutzerliste konnte nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Lädt die nächste Seite (Paginierung).
   */
  const loadMore = useCallback(async () => {
    if (!nextPageToken || loading) return

    setLoading(true)
    try {
      const result = await listUsersFunc({
        tenantId: currentTenantId,
        pageToken: nextPageToken,
      })
      setUsers((prev) => [...prev, ...(result.data.users || [])])
      setNextPageToken(result.data.nextPageToken || null)
    } catch (err) {
      console.error('[Admin] Fehler beim Nachladen:', err)
      setError('Weitere Nutzer konnten nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [nextPageToken, loading, currentTenantId])

  /** Aktualisiert einen einzelnen Nutzer im lokalen State. */
  const updateUserLocally = useCallback((uid, changes) => {
    setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, ...changes } : u))
  }, [])

  /** Entfernt einen Nutzer aus dem lokalen State. */
  const removeUserLocally = useCallback((uid) => {
    setUsers((prev) => prev.filter((u) => u.uid !== uid))
  }, [])

  return {
    users,
    loading,
    error,
    hasMore: !!nextPageToken,
    loadUsers,
    loadMore,
    updateUserLocally,
    removeUserLocally,
  }
}
