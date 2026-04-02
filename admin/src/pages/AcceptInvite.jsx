/**
 * AcceptInvite — Einladung annehmen.
 *
 * Zeigt ein Formular zum Registrieren oder Einloggen.
 * Nach erfolgreicher Auth wird acceptInvite aufgerufen.
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { doc, getDoc } from 'firebase/firestore'
import { auth, functions, db } from '@/firebase.js'
import { useAuth } from '@/hooks/useAuth.js'
import { translateAuthError } from '@support-chat/shared'
import styles from './Login.module.css'

const acceptInviteFunc = httpsCallable(functions, 'acceptInvite')
const googleProvider = new GoogleAuthProvider()

export default function AcceptInvite() {
  const { inviteId } = useParams()
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('register') // 'register' | 'login'
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(true)
  const [inviteError, setInviteError] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [status, setStatus] = useState('idle') // 'idle' | 'accepting' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  // Einladungs-E-Mail aus Firestore laden
  useEffect(() => {
    getDoc(doc(db, 'invites', inviteId))
      .then((snap) => {
        if (!snap.exists()) {
          setInviteError('Diese Einladung existiert nicht.')
          return
        }
        const data = snap.data()
        if (data.usedAt) {
          setInviteError('Diese Einladung wurde bereits verwendet.')
          return
        }
        if (data.expiresAt.toDate() < new Date()) {
          setInviteError('Diese Einladung ist abgelaufen.')
          return
        }
        setInviteEmail(data.email)
        setEmail(data.email)
      })
      .catch(() => setInviteError('Einladung konnte nicht geladen werden.'))
      .finally(() => setInviteLoading(false))
  }, [inviteId])

  // Sobald Nutzer eingeloggt ist → Einladung annehmen
  useEffect(() => {
    if (loading || !user || status !== 'idle') return

    setStatus('accepting')
    acceptInviteFunc({ inviteId })
      .then(() => {
        setStatus('success')
        // Token neu laden damit neue Claims aktiv werden
        user.getIdToken(true).then(() => {
          setTimeout(() => navigate('/conversations', { replace: true }), 2000)
        })
      })
      .catch((err) => {
        setStatus('error')
        setErrorMsg(err.message || 'Unbekannter Fehler')
      })
  }, [user, loading, inviteId, status])

  async function handleSubmit(e) {
    e.preventDefault()
    setAuthError('')
    if (mode === 'register' && password !== passwordConfirm) {
      setAuthError('Passwörter stimmen nicht überein.')
      return
    }
    setAuthLoading(true)
    try {
      if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, email, password)
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      // useEffect übernimmt ab hier
    } catch (err) {
      setAuthError(translateAuthError(err.code))
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleGoogle() {
    setAuthError('')
    setAuthLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      setAuthError(translateAuthError(err.code))
    } finally {
      setAuthLoading(false)
    }
  }

  if (inviteLoading || loading || status === 'accepting') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <span className={styles.logo}>💬</span>
            <h1 className={styles.title}>Einladung wird verarbeitet…</h1>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <span className={styles.logo}>✅</span>
            <h1 className={styles.title}>Konto erfolgreich erstellt</h1>
            <p className={styles.subtitle}>Du wirst weitergeleitet…</p>
          </div>
        </div>
      </div>
    )
  }

  if (inviteError) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <span className={styles.logo}>❌</span>
            <h1 className={styles.title}>Ungültige Einladung</h1>
          </div>
          <p className={styles.error}>{inviteError}</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.header}>
            <span className={styles.logo}>❌</span>
            <h1 className={styles.title}>Fehler</h1>
          </div>
          <p className={styles.error}>{errorMsg}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.logo}>💬</span>
          <h1 className={styles.title}>Einladung annehmen</h1>
          <p className={styles.subtitle}>
            {mode === 'register'
              ? 'Erstelle ein Konto um fortzufahren.'
              : 'Melde dich mit deinem bestehenden Konto an.'}
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">E-Mail</label>
            <input
              id="email"
              className={styles.input}
              type="email"
              value={email}
              readOnly
              autoComplete="email"
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Passwort</label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                className={styles.input}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                required
                disabled={authLoading}
                minLength={mode === 'register' ? 6 : undefined}
                style={{ width: '100%', paddingRight: '40px', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px', padding: 0 }}
              >
                {showPassword ? 'Verbergen' : 'Anzeigen'}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="passwordConfirm">Passwort bestätigen</label>
              <input
                id="passwordConfirm"
                className={styles.input}
                type={showPassword ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                required
                disabled={authLoading}
                minLength={6}
              />
            </div>
          )}

          {authError && <p className={styles.error}>{authError}</p>}

          <button type="submit" className={styles.btn} disabled={authLoading}>
            {authLoading ? '…' : mode === 'register' ? 'Konto erstellen' : 'Anmelden'}
          </button>
        </form>

        <div className={styles.divider}>oder</div>

        <button
          className={`${styles.btn} ${styles.btnGoogle}`}
          onClick={handleGoogle}
          disabled={authLoading}
        >
          <GoogleIcon />
          Mit Google fortfahren
        </button>

        <div className={styles.divider}>
          {mode === 'register' ? 'Bereits ein Konto?' : 'Noch kein Konto?'}
        </div>

        <button
          className={`${styles.btn} ${styles.btnGoogle}`}
          onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setAuthError('') }}
          disabled={authLoading}
        >
          {mode === 'register' ? 'Anmelden' : 'Konto erstellen'}
        </button>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}
