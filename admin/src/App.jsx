/**
 * Haupt-App-Komponente mit Routing.
 *
 * Routen-Struktur:
 *   /login                → Login-Seite
 *   /conversations        → Konversations-Liste (Tenant-Admin + Super-Admin)
 *   /conversations/:id    → Konversations-Detail
 *   /users                → Nutzer-Verwaltung
 *   /domains              → Domain-Whitelist
 *   /statistics           → Statistiken
 *   /tenants              → Tenant-Übersicht (nur Super-Admin)
 *   /tenants/:id          → Tenant-Detail (nur Super-Admin)
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute.jsx'
import Login from '@/pages/Login.jsx'
import Conversations from '@/pages/Conversations.jsx'
import ConversationDetail from '@/pages/ConversationDetail.jsx'
import Users from '@/pages/Users.jsx'
import Domains from '@/pages/Domains.jsx'
import Statistics from '@/pages/Statistics.jsx'
import Settings from '@/pages/Settings.jsx'
import Tenants from '@/pages/Tenants.jsx'
import TenantDetail from '@/pages/TenantDetail.jsx'
import AcceptInvite from '@/pages/AcceptInvite.jsx'
import './styles/globals.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Öffentliche Routen */}
        <Route path="/login" element={<Login />} />
        <Route path="/invite/:inviteId" element={<AcceptInvite />} />

        {/* Geschützte Routen — erfordern Admin-Rolle */}
        <Route element={<ProtectedRoute />}>
          <Route path="/conversations" element={<Conversations />} />
          <Route path="/conversations/:id" element={<ConversationDetail />} />
          <Route path="/users" element={<Users />} />
          <Route path="/domains" element={<Domains />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/settings" element={<Settings />} />

          {/* Nur Super-Admin */}
          <Route element={<ProtectedRoute requireSuperAdmin />}>
            <Route path="/tenants" element={<Tenants />} />
            <Route path="/tenants/:id" element={<TenantDetail />} />
          </Route>
        </Route>

        {/* Standardroute */}
        <Route path="/" element={<Navigate to="/conversations" replace />} />
        <Route path="*" element={<Navigate to="/conversations" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
