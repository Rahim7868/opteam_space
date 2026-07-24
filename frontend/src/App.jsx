import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'

// Auth
import Login          from './pages/Login'
import ChangePassword from './pages/ChangePassword'
import Profile from './pages/Profile'
import ForgotPassword from './pages/ForgotPassword'  // NOUVEAU
import ResetPassword from './pages/ResetPassword'    // NOUVEAU

// Dashboard
import Dashboard from './pages/Dashboard'

// Fixings & Bureaux
import Fixings       from './pages/Fixings'
import BureauChanges from './pages/BureauChanges'

// Acteurs
import Users       from './pages/Users'
import Roles       from './pages/Roles'
import Permissions from './pages/Permissions'

// Structure
import Agences      from './pages/Agences'
import Directions   from './pages/Directions'
import Departements from './pages/Departements'
import Services     from './pages/Services'

// Audit
import AuditLogs from './pages/AuditLogs'
import AuditAccessLogs from './pages/AuditAccessLogs'
import AuditExchangeLogs from './pages/AuditExchangeLogs'
import AuditLocationLogs from './pages/AuditLocationLogs'

export default function App() {
  return (
    <Routes>
      {/* Routes publiques */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />  {/* NOUVEAU */}
      <Route path="/reset-password" element={<ResetPassword />} />    {/* NOUVEAU */}

      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePassword />} />
      </Route>

      <Route element={<ProtectedRoute blockIfMustChange />}>
        <Route element={<AppLayout />}>

          <Route index element={<Dashboard />} />

          <Route path="profile" element={<Profile />} />

          <Route path="fixings"
            element={<ProtectedRoute permission="creer_fixing" />}>
            <Route index element={<Fixings />} />
          </Route>

          <Route path="bureau-changes"
            element={<ProtectedRoute permission="creer_bureau_change" />}>
            <Route index element={<BureauChanges />} />
          </Route>

          <Route path="users"
            element={<ProtectedRoute permission="gerer_acteurs" />}>
            <Route index element={<Users />} />
          </Route>

          <Route path="roles"
            element={<ProtectedRoute permission="gerer_roles" />}>
            <Route index element={<Roles />} />
          </Route>

          <Route path="permissions"
            element={<ProtectedRoute permission="gerer_permissions" />}>
            <Route index element={<Permissions />} />
          </Route>

          <Route path="agences"
            element={<ProtectedRoute permission="gerer_agences" />}>
            <Route index element={<Agences />} />
          </Route>

          <Route path="directions"
            element={<ProtectedRoute permission="gerer_directions" />}>
            <Route index element={<Directions />} />
          </Route>

          <Route path="departements"
            element={<ProtectedRoute permission="gerer_departements" />}>
            <Route index element={<Departements />} />
          </Route>

          <Route path="services"
            element={<ProtectedRoute permission="gerer_services" />}>
            <Route index element={<Services />} />
          </Route>

          <Route path="audit-logs"
            element={<ProtectedRoute permission="gerer_acteurs" />}>
            <Route index element={<Navigate to="/audit-logs/actions" replace />} />
            <Route path="actions" element={<AuditLogs />} />
            <Route path="fixings-bureaux" element={<AuditExchangeLogs />} />
            <Route path="locaux" element={<AuditLocationLogs />} />
            <Route path="acces" element={<AuditAccessLogs />} />
          </Route>

        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}