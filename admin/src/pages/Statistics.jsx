/**
 * Statistiken-Seite.
 * Placeholder — konkrete Metriken werden später definiert.
 */
import Layout from '@/components/Layout.jsx'
import styles from './Statistics.module.css'

export default function Statistics() {
  return (
    <Layout>
      <div className={styles.page}>
        <h1 className={styles.title}>Statistiken</h1>
        <div className={styles.placeholder}>
          <span className={styles.icon}>📊</span>
          <p className={styles.text}>
            Statistiken werden in einer späteren Version verfügbar sein.
          </p>
          <p className={styles.subtext}>
            Geplant: Anzahl Konversationen, Antwortzeiten, Nutzer-Wachstum u.v.m.
          </p>
        </div>
      </div>
    </Layout>
  )
}
