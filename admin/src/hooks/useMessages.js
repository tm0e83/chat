/**
 * useMessages Hook — Echtzeit-Nachrichten einer Konversation.
 *
 * Abonniert die messages-Subcollection einer Konversation.
 * Gibt Nachrichten in chronologischer Reihenfolge zurück.
 */
import { useState, useEffect } from 'react'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '@/firebase.js'
import { COLLECTIONS } from '@support-chat/shared'

/**
 * @param {string|null} conversationId - ID der Konversation (null = kein Abo)
 * @returns {{ messages: Array, loading: boolean, error: string|null }}
 */
export function useMessages(conversationId) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }

    setLoading(true)
    setMessages([])

    const ref = collection(
      db,
      COLLECTIONS.CONVERSATIONS,
      conversationId,
      COLLECTIONS.MESSAGES,
    )

    const q = query(ref, orderBy('createdAt', 'asc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.() || null,
        }))
        setMessages(msgs)
        setLoading(false)
      },
      (err) => {
        console.error('[Admin] Fehler beim Laden der Nachrichten:', err)
        setError('Nachrichten konnten nicht geladen werden.')
        setLoading(false)
      },
    )

    return unsubscribe
  }, [conversationId])

  return { messages, loading, error }
}
