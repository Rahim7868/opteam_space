import { LogIn, Mail, Lock } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { getApiError } from '../api/client'
import ErrorAlert from '../components/ErrorAlert'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Restaurer l'email si "Se souvenir de moi" était actif
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('remembered_email')
    if (rememberedEmail) {
      setForm(prev => ({ ...prev, email: rememberedEmail }))
      setRemember(true)
    }
  }, [])

  if (user && !user.must_change_password) return <Navigate to="/" replace />
  if (user && user.must_change_password) return <Navigate to="/change-password" replace />

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const { mustChangePassword } = await login(form, remember)
      
      if (remember) {
        localStorage.setItem('remembered_email', form.email)
      } else {
        localStorage.removeItem('remembered_email')
      }
      
      navigate(mustChangePassword ? '/change-password' : '/', { replace: true })
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">

        {/* Logo / Icône */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        {/* Titre */}
        <div className="mt-6 text-center">
          <h1 className="text-3xl font-bold text-slate-950">OPTEAM_SPACE</h1>
          <p className="mt-1 text-sm text-slate-500">Gestion des fixings de change</p>
        </div>

        {/* Séparateur */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 font-medium text-slate-500">🔗 Connexion</span>
          </div>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError('')} />

        <form className="mt-6 space-y-5" onSubmit={submit}>
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Adresse email</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                type="email"
                placeholder="admin@opteam.gn"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium text-slate-700">Mot de passe</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Options : Se souvenir de moi + Mot de passe oublié */}
          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              Se souvenir de moi
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-teal-600 hover:text-teal-700"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          {/* Bouton */}
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={submitting}
          >
            {submitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <LogIn size={16} />
            )}
            {submitting ? 'Connexion...' : 'Se connecter'}
          </button>

          <p className="text-center text-xs text-slate-400">Connectez-vous en toute sécurité</p>
        </form>
      </div>
    </div>
  )
}