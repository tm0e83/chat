/**
 * Konversations-Detailseite — Nachrichten-Thread mit Antwort-Funktion.
 *
 * Features:
 * - Echtzeit-Nachrichten (onSnapshot via useMessages)
 * - Admin-Antwort (fügt Nachricht in Subcollection ein)
 * - Konversation als "Gelöst" markieren
 * - Unread-Counter zurücksetzen wenn Seite geöffnet wird
 */
import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  serverTimestamp,
  increment,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/firebase.js'
import { useAuth } from '@/hooks/useAuth.js'
import { useMessages } from '@/hooks/useMessages.js'
import Layout from '@/components/Layout.jsx'
import { COLLECTIONS, SENDER_ROLE, formatDateTime } from '@support-chat/shared'
import styles from './ConversationDetail.module.css'

export default function ConversationDetail() {
  const { id: conversationId } = useParams()
  const { user } = useAuth()
  const { messages, loading } = useMessages(conversationId)
  const [conversation, setConversation] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  // Konversations-Metadaten laden
  useEffect(() => {
    if (!conversationId) return
    getDoc(doc(db, COLLECTIONS.CONVERSATIONS, conversationId)).then((snap) => {
      if (snap.exists()) setConversation({ id: snap.id, ...snap.data() })
    })
  }, [conversationId])

  // Unread-Counter zurücksetzen wenn der Admin die Konversation öffnet
  useEffect(() => {
    if (!conversationId) return
    updateDoc(doc(db, COLLECTIONS.CONVERSATIONS, conversationId), {
      unreadByAdmin: 0,
    }).catch(console.error)
  }, [conversationId])

  // Automatisch nach unten scrollen bei neuen Nachrichten
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /** Admin sendet eine Antwort */
  async function handleReply(e) {
    e.preventDefault()
    const text = replyText.trim()
    if (!text || !user) return

    setSending(true)
    try {
      // Nachricht + Metadaten-Update atomar in einem Batch schreiben
      const batch = writeBatch(db)

      const msgRef = doc(collection(db, COLLECTIONS.CONVERSATIONS, conversationId, COLLECTIONS.MESSAGES))
      batch.set(msgRef, {
        text,
        senderId: user.uid,
        senderRole: SENDER_ROLE.ADMIN,
        createdAt: serverTimestamp(),
        read: false,
      })

      batch.update(doc(db, COLLECTIONS.CONVERSATIONS, conversationId), {
        lastMessage: text.length > 80 ? text.slice(0, 80) + '…' : text,
        updatedAt: serverTimestamp(),
        unreadByUser: increment(1),
        unreadByAdmin: 0,
      })

      await batch.commit()

      setReplyText('')
    } catch (err) {
      console.error('Antwort konnte nicht gesendet werden:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <Layout>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <Link to="/conversations" className={styles.backLink}>
            ← Zurück
          </Link>
          <div className={styles.headerInfo}>
            <h1 className={styles.title}>
              {conversation?.userEmail || 'Konversation'}
            </h1>
          </div>
        </div>

        {/* Nachrichten-Thread */}
        <div className={styles.messages}>
          {loading && <p className={styles.hint}>Nachrichten werden geladen…</p>}

          {!loading && messages.length === 0 && (
            <p className={styles.hint}>Noch keine Nachrichten.</p>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.message} ${msg.senderRole === SENDER_ROLE.ADMIN ? styles.messageAdmin : styles.messageUser}`}
            >
              <div className={styles.bubble}>{msg.text}</div>
              <div className={styles.time}>{formatDateTime(msg.createdAt)}</div>
            </div>
          ))}

          {/* Scroll-Anker */}
          <div ref={bottomRef} />
        </div>

        {/* Antwort-Eingabe */}
        <form className={styles.replyForm} onSubmit={handleReply}>
            <textarea
              className={styles.replyInput}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Antwort schreiben… (Strg+Enter zum Senden)"
              rows={3}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) handleReply(e)
              }}
            />
            <button
              type="submit"
              className={styles.sendBtn}
              disabled={!replyText.trim() || sending}
            >
              {sending ? 'Senden…' : 'Antworten'}
            </button>
          </form>
      </div>
    </Layout>
  )
}

