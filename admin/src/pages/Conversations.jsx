/**
 * Konversations-Seite — Liste aller Support-Chats mit Echtzeit-Updates.
 *
 * Features:
 * - Konversations-Liste mit Unread-Badges
 * - Filter nach Status (offen / gelöst)
 * - Suche nach E-Mail oder Nachrichteninhalt
 * - Konversation löschen
 * - Klick öffnet Detailansicht (ConversationDetail)
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { httpsCallable } from 'firebase/functions'
import { functions } from '@/firebase.js'
import { useAuth } from '@/hooks/useAuth.js'
import { useConversations } from '@/hooks/useConversations.js'
import Layout from '@/components/Layout.jsx'
import { formatRelativeTime } from '@support-chat/shared'
import styles from './Conversations.module.css'

const deleteConversationFunc = httpsCallable(functions, 'deleteConversation')
const searchMessagesFunc = httpsCallable(functions, 'searchMessages')

export default function Conversations() {
  const { role, tenantId } = useAuth()
  const [searchMode, setSearchMode] = useState('email') // 'email' | 'message'
  const [searchTerm, setSearchTerm] = useState('')
  const [messageSearchResults, setMessageSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  // E-Mail-Suche geht direkt über Firestore-Query im Hook
  const emailSearch = searchMode === 'email' ? searchTerm : ''

  const { conversations, loading, error } = useConversations({
    tenantId,
    role,
    emailSearch,
  })

  /** Suche nach Nachrichteninhalt via Cloud Function */
  async function handleMessageSearch(conversationId) {
    if (!searchTerm.trim()) return
    setSearching(true)
    try {
      const result = await searchMessagesFunc({ conversationId, keyword: searchTerm })
      setMessageSearchResults(result.data.matches || [])
    } catch (err) {
      console.error('Suche fehlgeschlagen:', err)
    } finally {
      setSearching(false)
    }
  }

  /** Konversation dauerhaft löschen */
  async function handleDelete(conversationId) {
    try {
      await deleteConversationFunc({ conversationId })
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Löschen fehlgeschlagen:', err)
    }
  }

  return (
    <Layout>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Konversationen</h1>

        </div>

        {/* Suchleiste */}
        <div className={styles.searchBar}>
          <div className={styles.searchModeToggle}>
            <button
              className={`${styles.searchModeBtn} ${searchMode === 'email' ? styles.searchModeBtnActive : ''}`}
              onClick={() => { setSearchMode('email'); setMessageSearchResults(null) }}
            >
              Nutzer
            </button>
            <button
              className={`${styles.searchModeBtn} ${searchMode === 'message' ? styles.searchModeBtnActive : ''}`}
              onClick={() => setSearchMode('message')}
            >
              Nachrichten
            </button>
          </div>
          <input
            className={styles.searchInput}
            type="search"
            placeholder={searchMode === 'email' ? 'E-Mail suchen…' : 'Suchbegriff…'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Liste */}
        {loading && <p className={styles.hint}>Laden…</p>}
        {error && <p className={styles.error}>{error}</p>}

        {!loading && !error && conversations.length === 0 && (
          <p className={styles.hint}>Keine Konversationen gefunden.</p>
        )}

        <div className={styles.list}>
          {conversations.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              searchMode={searchMode}
              searchTerm={searchTerm}
              onMessageSearch={() => handleMessageSearch(conv.id)}
              onDelete={() => setDeleteConfirm(conv.id)}
            />
          ))}
        </div>
      </div>

      {/* Bestätigungs-Dialog für Löschen */}
      {deleteConfirm && (
        <div className={styles.overlay}>
          <div className={styles.dialog}>
            <p className={styles.dialogText}>
              Diese Konversation und alle Nachrichten dauerhaft löschen?
            </p>
            <div className={styles.dialogActions}>
              <button className={styles.btnSecondary} onClick={() => setDeleteConfirm(null)}>
                Abbrechen
              </button>
              <button className={styles.btnDanger} onClick={() => handleDelete(deleteConfirm)}>
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

/** Einzelne Konversations-Zeile */
function ConversationItem({ conversation: conv, onMessageSearch, onDelete, searchMode, searchTerm }) {
  const hasUnread = conv.unreadByAdmin > 0

  return (
    <div className={`${styles.item} ${hasUnread ? styles.itemUnread : ''}`}>
      <Link to={`/conversations/${conv.id}`} className={styles.itemLink}>
        <div className={styles.itemHeader}>
          <span className={styles.itemEmail}>{conv.userEmail || 'Unbekannt'}</span>
          {hasUnread && (
            <span className={styles.badge}>{conv.unreadByAdmin}</span>
          )}
        </div>
        <div className={styles.itemPreview}>{conv.lastMessage || 'Keine Nachrichten'}</div>
        <div className={styles.itemMeta}>
          {formatRelativeTime(conv.updatedAt)}
        </div>
      </Link>

      <div className={styles.itemActions}>
        {searchMode === 'message' && searchTerm && (
          <button className={styles.actionBtn} onClick={onMessageSearch} title="In Nachrichten suchen">
            🔍
          </button>
        )}
        <button className={styles.actionBtn} onClick={onDelete} title="Löschen">
          🗑
        </button>
      </div>
    </div>
  )
}

