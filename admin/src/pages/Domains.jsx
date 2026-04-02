/**
 * Domains-Seite — Domain-Whitelist eines Tenants verwalten.
 * Erlaubte Domains werden aus dem Tenant-Dokument geladen und können
 * hinzugefügt und entfernt werden.
 */
import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '@/firebase.js'
import { useAuth } from '@/hooks/useAuth.js'
import Layout from '@/components/Layout.jsx'
import { COLLECTIONS } from '@support-chat/shared'
import styles from './Domains.module.css'

/** Einfache Validierung eines Hostnamens (z.B. "example.com") */
function isValidHostname(value) {
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(value)
}

export default function Domains() {
  const { tenantId } = useAuth()
  const [domains, setDomains] = useState([])
  const [newDomain, setNewDomain] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Domains aus Firestore laden
  useEffect(() => {
    if (!tenantId) return
    getDoc(doc(db, COLLECTIONS.TENANTS, tenantId)).then((snap) => {
      if (snap.exists()) setDomains(snap.data().domains || [])
      setLoading(false)
    })
  }, [tenantId])

  async function handleAdd() {
    const domain = newDomain.trim().toLowerCase()

    if (!domain) return
    if (!isValidHostname(domain)) {
      setError('Bitte gib einen gültigen Hostnamen ein (z.B. example.com)')
      return
    }
    if (domains.includes(domain)) {
      setError('Diese Domain ist bereits eingetragen.')
      return
    }

    setError('')
    setSaving(true)
    try {
      await updateDoc(doc(db, COLLECTIONS.TENANTS, tenantId), {
        domains: arrayUnion(domain),
      })
      setDomains((prev) => [...prev, domain])
      setNewDomain('')
    } catch (err) {
      setError('Domain konnte nicht gespeichert werden.')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(domain) {
    setSaving(true)
    try {
      await updateDoc(doc(db, COLLECTIONS.TENANTS, tenantId), {
        domains: arrayRemove(domain),
      })
      setDomains((prev) => prev.filter((d) => d !== domain))
    } catch (err) {
      setError('Domain konnte nicht entfernt werden.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className={styles.page}>
        <h1 className={styles.title}>Domain-Whitelist</h1>
        <p className={styles.description}>
          Das Chat-Widget wird nur auf diesen Domains geladen.
          Änderungen wirken sofort beim nächsten Seitenaufruf des Widgets.
        </p>

        {/* Neue Domain hinzufügen */}
        <div className={styles.addRow}>
          <input
            className={styles.input}
            type="text"
            value={newDomain}
            onChange={(e) => { setNewDomain(e.target.value); setError('') }}
            placeholder="example.com"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            disabled={saving}
          />
          <button className={styles.addBtn} onClick={handleAdd} disabled={saving || !newDomain}>
            Hinzufügen
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}

        {/* Domain-Liste */}
        {loading && <p className={styles.hint}>Laden…</p>}

        {!loading && domains.length === 0 && (
          <p className={styles.hint}>Noch keine Domains eingetragen.</p>
        )}

        <ul className={styles.list}>
          {domains.map((domain) => (
            <li key={domain} className={styles.item}>
              <span className={styles.domain}>{domain}</span>
              <button
                className={styles.removeBtn}
                onClick={() => handleRemove(domain)}
                disabled={saving}
                aria-label={`${domain} entfernen`}
              >
                Entfernen
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  )
}
