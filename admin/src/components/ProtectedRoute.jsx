/**
 * ProtectedRoute — schützt Routen vor unauthentifizierten und nicht autorisierten Zugriffen.
 *
 * Prüft:
 * 1. Ist der Nutzer eingeloggt?
 * 2. Hat er mindestens die Rolle 'admin' oder 'superadmin'?
 * 3. Wenn requireSuperAdmin: hat er die Rolle 'superadmin'?
 *
 * Bei fehlender Berechtigung → Redirect zur Login-Seite.
 */
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth.js'
import { ROLES } from '@support-chat/shared'

/**
 * @param {{ requireSuperAdmin?: boolean }} props
 */
export default function ProtectedRoute({ requireSuperAdmin = false }) {
  const { user, role, loading } = useAuth()

  // Warten bis Auth-Status bekannt ist
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: 'var(--text-secondary)',
      }}>
        <div className="spinner" aria-label="Laden..." />
      </div>
    )
  }

  // Nicht eingeloggt
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Keine Admin-Rolle
  if (!role) {
    return <Navigate to="/login" replace />
  }

  // Super-Admin erforderlich aber Nutzer ist nur Tenant-Admin
  if (requireSuperAdmin && role !== ROLES.SUPER_ADMIN) {
    return <Navigate to="/conversations" replace />
  }

  // Berechtigt — Kind-Routen rendern
  return <Outlet />
}
