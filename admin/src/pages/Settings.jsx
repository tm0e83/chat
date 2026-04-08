/**
 * Einstellungen-Seite — Theme-Auswahl für das Chat-Widget.
 * Das gewählte Theme wird in tenant.branding.theme in Firestore gespeichert
 * und beim nächsten Widget-Laden automatisch angewendet.
 */
import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase.js'
import { useAuth } from '@/hooks/useAuth.js'
import Layout from '@/components/Layout.jsx'
import { COLLECTIONS, THEMES, DEFAULT_THEME } from '@support-chat/shared'
import styles from './Settings.module.css'

export default function Settings() {
  const { tenantId } = useAuth()
  const [selectedTheme, setSelectedTheme] = useState(DEFAULT_THEME)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    getDoc(doc(db, COLLECTIONS.TENANTS, tenantId)).then((snap) => {
      if (snap.exists()) {
        setSelectedTheme(snap.data().branding?.theme || DEFAULT_THEME)
      }
      setLoading(false)
    })
  }, [tenantId])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    try {
      await updateDoc(doc(db, COLLECTIONS.TENANTS, tenantId), {
        'branding.theme': selectedTheme,
      })
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className={styles.page}>
        <h1 className={styles.title}>Einstellungen</h1>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Theme</h2>
          <p className={styles.description}>
            Wähle das Erscheinungsbild des Chat-Widgets. Jedes Theme unterstützt
            automatisch einen Hell- und Dunkel-Modus entsprechend der Systempräferenz
            des Nutzers.
          </p>

          {loading ? (
            <p className={styles.hint}>Laden…</p>
          ) : (
            <div className={styles.themeGrid}>
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  className={`${styles.themeCard} ${selectedTheme === theme.id ? styles.themeCardActive : ''}`}
                  onClick={() => { setSelectedTheme(theme.id); setSaved(false) }}
                  aria-pressed={selectedTheme === theme.id}
                >
                  <div className={styles.themePreview}>
                    <span className={styles.previewDark} />
                    <span className={styles.previewLight} />
                  </div>
                  <span className={styles.themeName}>{theme.name}</span>
                </button>
              ))}
            </div>
          )}

          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? 'Speichern…' : saved ? 'Gespeichert ✓' : 'Speichern'}
          </button>
        </section>
      </div>
    </Layout>
  )
}
