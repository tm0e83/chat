/**
 * Nutzer-Verwaltungs-Seite.
 * Zeigt alle Nutzer des Tenants und ermöglicht Sperren/Entsperren/Löschen.
 */
import { useEffect, useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase.js'
import { useAuth } from '@/hooks/useAuth.js'
import { useUsers } from '@/hooks/useUsers.js'
import Layout from '@/components/Layout.jsx'
import { formatDate } from '@support-chat/shared'
import styles from './Users.module.css'

const disableUserFunc = httpsCallable(functions, 'disableUser')
const enableUserFunc = httpsCallable(functions, 'enableUser')
const deleteUserFunc = httpsCallable(functions, 'deleteUser')

export default function Users() {
  const { tenantId } = useAuth()
  const { users, loading, error, hasMore, loadUsers, loadMore, updateUserLocally, removeUserLocally } = useUsers()
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    if (tenantId) loadUsers(tenantId)
  }, [tenantId, loadUsers])

  async function handleDisable(uid, currentlyDisabled) {
    setActionLoading(uid)
    try {
      if (currentlyDisabled) {
        await enableUserFunc({ uid, tenantId })
      } else {
        await disableUserFunc({ uid, tenantId })
      }
      // Optimistisch: nur den betroffenen Nutzer im lokalen State aktualisieren
      updateUserLocally(uid, { disabled: !currentlyDisabled })
    } catch (err) {
      console.error('Aktion fehlgeschlagen:', err)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(uid) {
    setActionLoading(uid)
    try {
      await deleteUserFunc({ uid, tenantId })
      setDeleteConfirm(null)
      removeUserLocally(uid)
    } catch (err) {
      console.error('Löschen fehlgeschlagen:', err)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <Layout>
      <div className={styles.page}>
        <h1 className={styles.title}>Nutzer</h1>

        {loading && users.length === 0 && <p className={styles.hint}>Laden…</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && users.length === 0 && !error && (
          <p className={styles.hint}>Keine Nutzer gefunden.</p>
        )}

        <div className={styles.table}>
          {users.map((user) => (
            <div key={user.uid} className={`${styles.row} ${user.disabled ? styles.rowDisabled : ''}`}>
              <div className={styles.userInfo}>
                <div className={styles.userEmail}>{user.email || user.uid}</div>
                <div className={styles.userMeta}>
                  {user.displayName && <span>{user.displayName} · </span>}
                  Erstellt: {formatDate(user.metadata?.creationTime)}
                  {user.disabled && <span className={styles.disabledTag}>Gesperrt</span>}
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.actionBtn}
                  onClick={() => handleDisable(user.uid, user.disabled)}
                  disabled={actionLoading === user.uid}
                >
                  {user.disabled ? 'Entsperren' : 'Sperren'}
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                  onClick={() => setDeleteConfirm(user.uid)}
                  disabled={actionLoading === user.uid}
                >
                  Löschen
                </button>
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <button className={styles.loadMoreBtn} onClick={loadMore} disabled={loading}>
            {loading ? 'Laden…' : 'Weitere laden'}
          </button>
        )}
      </div>

      {deleteConfirm && (
        <div className={styles.overlay}>
          <div className={styles.dialog}>
            <p className={styles.dialogText}>
              Nutzer dauerhaft löschen? Alle Konversationen und Nachrichten dieses Nutzers werden ebenfalls gelöscht.
            </p>
            <div className={styles.dialogActions}>
              <button className={styles.btnSecondary} onClick={() => setDeleteConfirm(null)}>
                Abbrechen
              </button>
              <button
                className={styles.btnDanger}
                onClick={() => handleDelete(deleteConfirm)}
                disabled={actionLoading === deleteConfirm}
              >
                {actionLoading === deleteConfirm ? 'Löschen…' : 'Löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

