import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ permission, blockIfMustChange }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600" />
      </div>
    )
  }

  // Non connecté
  if (!user) return <Navigate to="/login" replace />

  // Doit changer son mot de passe → bloqué sauf sur /change-password
  if (blockIfMustChange && user.must_change_password) {
    return <Navigate to="/change-password" replace />
  }

  // Permission manquante
  if (permission && !user.toutes_permissions?.includes(permission)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}