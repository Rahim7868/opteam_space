import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import Agents from './pages/Agents'
import AuditLogs from './pages/AuditLogs'
import Bureaux from './pages/Bureaux'
import Dashboard from './pages/Dashboard'
import Fixings from './pages/Fixings'
import Login from './pages/Login'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="bureaux" element={<Bureaux />} />
          <Route path="fixings" element={<Fixings />} />
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="agents" element={<Agents />} />
            <Route path="historique" element={<AuditLogs />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
