import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ permission, permissions, blockIfMustChange }) {
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

  // Toutes les permissions effectives (gère le cas Array ou Object)
  const userPerms = Array.isArray(user.toutes_permissions)
    ? user.toutes_permissions
    : Object.values(user.toutes_permissions ?? {})

  // Permission unique requise
  if (permission && !userPerms.includes(permission)) {
    return <Navigate to="/" replace />
  }

  // Tableau de permissions : l'utilisateur doit en avoir AU MOINS UNE
  if (permissions && permissions.length > 0) {
    const hasAny = permissions.some((p) => userPerms.includes(p))
    if (!hasAny) return <Navigate to="/" replace />
  }

  return <Outlet />
}