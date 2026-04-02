/**
 * Tenant-Detailseite (nur Super-Admin).
 * Zeigt Tenant-Infos und ermöglicht Suspendieren/Löschen.
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/firebase.js'
import Layout from '@/components/Layout.jsx'
import { COLLECTIONS, TENANT_STATUS } from '@support-chat/shared'
import styles from './TenantDetail.module.css'

const deleteTenantFunc = httpsCallable(functions, 'deleteTenant')

export default function TenantDetail() {
  const { id: tenantId } = useParams()
  const navigate = useNavigate()
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  useEffect(() => {
    getDoc(doc(db, COLLECTIONS.TENANTS, tenantId)).then((snap) => {
      if (snap.exists()) setTenant({ id: snap.id, ...snap.data() })
      setLoading(false)
    })
  }, [tenantId])

  async function toggleSuspend() {
    const newStatus = tenant.status === TENANT_STATUS.SUSPENDED
      ? TENANT_STATUS.ACTIVE
      : TENANT_STATUS.SUSPENDED
    setSaving(true)
    await updateDoc(doc(db, COLLECTIONS.TENANTS, tenantId), { status: newStatus })
    setTenant((prev) => ({ ...prev, status: newStatus }))
    setSaving(false)
  }

  async function handleDelete() {
    setSaving(true)
    try {
      await deleteTenantFunc({ tenantId })
      navigate('/tenants')
    } catch (err) {
      console.error('Löschen fehlgeschlagen:', err)
      setSaving(false)
    }
  }

  if (loading) return <Layout><p style={{ padding: 32 }}>Laden…</p></Layout>
  if (!tenant) return <Layout><p style={{ padding: 32 }}>Tenant nicht gefunden.</p></Layout>

  const isSuspended = tenant.status === TENANT_STATUS.SUSPENDED

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>{tenant.name || tenant.ownerEmail}</h1>
          <span className={`${styles.statusTag} ${isSuspended ? styles.tagSuspended : styles.tagActive}`}>
            {isSuspended ? 'Gesperrt' : 'Aktiv'}
          </span>
        </div>

        <div className={styles.infoGrid}>
          <InfoRow label="Owner" value={tenant.ownerEmail} />
          <InfoRow label="Tenant-ID" value={tenant.id} mono />
          <InfoRow label="Domains" value={tenant.domains?.join(', ') || '–'} />
          <InfoRow label="Erstellt" value={tenant.createdAt?.toDate?.().toLocaleDateString('de-DE') || '–'} />
        </div>

        <div className={styles.actions}>
          <button
            className={isSuspended ? styles.btnActivate : styles.btnSuspend}
            onClick={toggleSuspend}
            disabled={saving}
          >
            {isSuspended ? 'Entsperren' : 'Sperren'}
          </button>
          <button
            className={styles.btnDelete}
            onClick={() => setDeleteConfirm(true)}
            disabled={saving}
          >
            Tenant löschen
          </button>
        </div>
      </div>

      {deleteConfirm && (
        <div className={styles.overlay}>
          <div className={styles.dialog}>
            <p className={styles.dialogText}>
              Tenant dauerhaft löschen? Alle Konversationen, Nachrichten und Nutzer des Tenants werden unwiderruflich entfernt.
            </p>
            <div className={styles.dialogActions}>
              <button className={styles.btnSecondary} onClick={() => setDeleteConfirm(false)}>
                Abbrechen
              </button>
              <button className={styles.btnDanger} onClick={handleDelete} disabled={saving}>
                {saving ? 'Löschen…' : 'Dauerhaft löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

function InfoRow({ label, value, mono = false }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={`${styles.infoValue} ${mono ? styles.mono : ''}`}>{value}</span>
    </div>
  )
}
