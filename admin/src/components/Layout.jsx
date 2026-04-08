/**
 * Layout-Komponente — gemeinsames Shell-Layout für alle Admin-Seiten.
 * Enthält Sidebar-Navigation und den Haupt-Content-Bereich.
 *
 * Sidebar-Zustände:
 *   - Expanded (240px):  Standard auf Desktop, Icons + Labels
 *   - Collapsed (56px):  Icon-only-Modus auf Desktop
 *   - Mobile:            Sidebar als Overlay, ein-/ausklappbar via Hamburger
 */
import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
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
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Mobile-Sidebar bei Navigation automatisch schließen
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  async function handleLogout() {
    await signOut(auth)
    navigate('/login')
  }

  const sidebarClass = [
    styles.sidebar,
    collapsed ? styles.sidebarCollapsed : '',
    mobileOpen ? styles.sidebarMobileOpen : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.shell}>
      {/* Backdrop für Mobile */}
      {mobileOpen && (
        <div className={styles.backdrop} onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={sidebarClass}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>💬</span>
          {!collapsed && <span className={styles.logoText}>Support Chat</span>}
          <button
            className={styles.toggleBtn}
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Sidebar ausklappen' : 'Sidebar einklappen'}
            title={collapsed ? 'Ausklappen' : 'Einklappen'}
          >
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <nav className={styles.nav}>
          <NavItem to="/conversations" label="Konversationen" icon="🗨" collapsed={collapsed} />
          <NavItem to="/users" label="Nutzer" icon="👥" collapsed={collapsed} />
          <NavItem to="/domains" label="Domains" icon="🌐" collapsed={collapsed} />
          <NavItem to="/statistics" label="Statistiken" icon="📊" collapsed={collapsed} />
          <NavItem to="/settings" label="Einstellungen" icon="⚙" collapsed={collapsed} />

          {/* Nur Super-Admin */}
          {role === ROLES.SUPER_ADMIN && (
            <>
              <div className={styles.navDivider} />
              <NavItem to="/tenants" label="Tenants" icon="🏢" collapsed={collapsed} />
            </>
          )}
        </nav>

        {/* Nutzer-Info + Logout */}
        <div className={styles.userArea}>
          {!collapsed && (
            <>
              <div className={styles.userEmail}>{user?.email}</div>
              <div className={styles.userRole}>
                {role === ROLES.SUPER_ADMIN ? 'Super-Admin' : 'Admin'}
              </div>
            </>
          )}
          <button
            className={`${styles.logoutBtn} ${collapsed ? styles.logoutBtnCollapsed : ''}`}
            onClick={handleLogout}
            title="Abmelden"
          >
            {collapsed ? '⏻' : 'Abmelden'}
          </button>
        </div>
      </aside>

      {/* Haupt-Content */}
      <main className={styles.main}>
        {/* Mobile-Header mit Hamburger */}
        <div className={styles.mobileHeader}>
          <button
            className={styles.hamburger}
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Menü öffnen"
          >
            ☰
          </button>
          <span className={styles.mobileTitle}>Support Chat</span>
        </div>
        {children}
      </main>
    </div>
  )
}

/**
 * Einzelner Navigations-Link in der Sidebar.
 */
function NavItem({ to, label, icon, collapsed }) {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [styles.navItem, isActive ? styles.navItemActive : '', collapsed ? styles.navItemCollapsed : '']
          .filter(Boolean).join(' ')
      }
    >
      <span className={styles.navIcon}>{icon}</span>
      {!collapsed && <span>{label}</span>}
    </NavLink>
  )
}
