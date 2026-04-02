/**
 * Tenants-Seite (nur Super-Admin).
 * Übersicht aller Tenants mit Einladungsfunktion.
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { collection, query, orderBy, getDocs } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/firebase.js'
import Layout from '@/components/Layout.jsx'
import { COLLECTIONS, TENANT_STATUS } from '@support-chat/shared'
import styles from './Tenants.module.css'

const inviteTenantFunc = httpsCallable(functions, 'inviteTenant')

export default function Tenants() {
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    loadTenants()
  }, [])

  async function loadTenants() {
    setLoading(true)
    const q = query(collection(db, COLLECTIONS.TENANTS), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    setTenants(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)
    setInviteError('')
    setInviteSuccess(false)
    try {
      await inviteTenantFunc({ email: inviteEmail.trim() })
      setInviteSuccess(true)
      setInviteEmail('')
    } catch (err) {
      setInviteError('Einladung konnte nicht gesendet werden.')
    } finally {
      setInviting(false)
    }
  }

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>Tenants</h1>
          <span className={styles.count}>{tenants.length} gesamt</span>
        </div>

        {/* Einladungs-Formular */}
        <div className={styles.inviteBox}>
          <h2 className={styles.inviteTitle}>Neuen Tenant einladen</h2>
          <form className={styles.inviteForm} onSubmit={handleInvite}>
            <input
              className={styles.input}
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="E-Mail-Adresse des zukünftigen Tenant-Admins"
              disabled={inviting}
              required
            />
            <button className={styles.inviteBtn} type="submit" disabled={inviting}>
              {inviting ? 'Senden…' : 'Einladen'}
            </button>
          </form>
          {inviteSuccess && <p className={styles.success}>Einladung wurde gesendet.</p>}
          {inviteError && <p className={styles.error}>{inviteError}</p>}
        </div>

        {/* Tenant-Liste */}
        {loading && <p className={styles.hint}>Laden…</p>}

        <div className={styles.list}>
          {tenants.map((tenant) => (
            <Link key={tenant.id} to={`/tenants/${tenant.id}`} className={styles.item}>
              <div className={styles.itemName}>{tenant.name || tenant.ownerEmail}</div>
              <div className={styles.itemMeta}>
                {tenant.ownerEmail} · {tenant.domains?.length || 0} Domain(s)
              </div>
              <span className={`${styles.statusTag} ${tenant.status === TENANT_STATUS.SUSPENDED ? styles.tagSuspended : styles.tagActive}`}>
                {tenant.status === TENANT_STATUS.SUSPENDED ? 'Gesperrt' : 'Aktiv'}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  )
}
