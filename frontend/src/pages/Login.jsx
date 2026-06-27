import { LogIn } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getApiError } from '../api/client'
import ErrorAlert from '../components/ErrorAlert'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm]           = useState({ email: '', password: '' })
  const [error, setError]         = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user && !user.must_change_password) return <Navigate to="/" replace />
  if (user && user.must_change_password)  return <Navigate to="/change-password" replace />

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const { mustChangePassword } = await login(form)
      navigate(mustChangePassword ? '/change-password' : '/', { replace: true })
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="panel w-full max-w-md p-8">

        <div className="mb-8">
          <div className="text-sm font-bold uppercase tracking-wider text-teal-700">
            OPTEAM_SPACE
          </div>
          <h1 className="mt-2 text-2xl font-black text-slate-950">Connexion</h1>
          <p className="mt-2 text-sm text-slate-500">
            Gestion des fixings de change pour bureaux de change.
          </p>
        </div>

        <ErrorAlert message={error} />

        <form className="space-y-4" onSubmit={submit}>
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input
              className="field mt-1"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Mot de passe
            <input
              className="field mt-1"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>

          <button className="btn btn-primary w-full" disabled={submitting}>
            {submitting
              ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              : <LogIn size={16} />
            }
            {submitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
