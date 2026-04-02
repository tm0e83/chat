/**
 * Layout-Komponente — gemeinsames Shell-Layout für alle Admin-Seiten.
 * Enthält Sidebar-Navigation und den Haupt-Content-Bereich.
 */
import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '@/firebase.js'
import { useAuth } from '@/hooks/useAuth.js'
import { ROLES } from '@support-chat/shared'
import styles from './Layout.module.css'

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function Layout({ children }) {
  const { user, role } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>💬</span>
          <span className={styles.logoText}>Support Chat</span>
        </div>

        <nav className={styles.nav}>
          <NavItem to="/conversations" label="Konversationen" icon="🗨" />
          <NavItem to="/users" label="Nutzer" icon="👥" />
          <NavItem to="/domains" label="Domains" icon="🌐" />
          <NavItem to="/statistics" label="Statistiken" icon="📊" />

          {/* Nur Super-Admin */}
          {role === ROLES.SUPER_ADMIN && (
            <>
              <div className={styles.navDivider} />
              <NavItem to="/tenants" label="Tenants" icon="🏢" />
            </>
          )}
        </nav>

        {/* Nutzer-Info + Logout */}
        <div className={styles.userArea}>
          <div className={styles.userEmail}>{user?.email}</div>
          <div className={styles.userRole}>
            {role === ROLES.SUPER_ADMIN ? 'Super-Admin' : 'Admin'}
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Abmelden
          </button>
        </div>
      </aside>

      {/* Haupt-Content */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  )
}

/**
 * Einzelner Navigations-Link in der Sidebar.
 */
function NavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
      }
    >
      <span className={styles.navIcon}>{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}
