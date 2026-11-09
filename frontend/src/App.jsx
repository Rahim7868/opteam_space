import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'

// Auth — imports statiques (bundle minimal pour /login)
import Login          from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

// Pages protégées — chargement différé (lazy loading)
const ChangePassword  = lazy(() => import('./pages/ChangePassword'))
const AppLayout       = lazy(() => import('./layouts/AppLayout'))
const Dashboard       = lazy(() => import('./pages/Dashboard'))
const Profile         = lazy(() => import('./pages/Profile'))
const Fixings         = lazy(() => import('./pages/Fixings'))
const BureauChanges   = lazy(() => import('./pages/BureauChanges'))
const Users           = lazy(() => import('./pages/Users'))
const Roles           = lazy(() => import('./pages/Roles'))
const Permissions     = lazy(() => import('./pages/Permissions'))
const Agences         = lazy(() => import('./pages/Agences'))
const Directions      = lazy(() => import('./pages/Directions'))
const Departements    = lazy(() => import('./pages/Departements'))
const Services        = lazy(() => import('./pages/Services'))
const AuditLogs       = lazy(() => import('./pages/AuditLogs'))
const AuditAccessLogs = lazy(() => import('./pages/AuditAccessLogs'))
const AuditExchangeLogs = lazy(() => import('./pages/AuditExchangeLogs'))
const AuditLocationLogs = lazy(() => import('./pages/AuditLocationLogs'))

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

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
              element={<ProtectedRoute permissions={['creer_acteurs', 'modifier_acteurs', 'supprimer_acteurs', 'desactiver_acteurs', 'approuver_modification_user']} />}>
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
              element={<ProtectedRoute permission="consulter_audits" />}>
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
    </Suspense>
  )
}