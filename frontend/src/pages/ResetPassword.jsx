import { KeyRound, ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api, { getApiError } from '../api/client'
import ErrorAlert from '../components/ErrorAlert'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    password: '',
    password_confirmation: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const email = searchParams.get('email')
    const token = searchParams.get('token')
    
    if (!email || !token) {
      setError('Lien de réinitialisation invalide ou expiré')
    } else {
      setForm(prev => ({ ...prev, email }))
    }
  }, [searchParams])

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    const token = searchParams.get('token')

    if (!token) {
      setError('Token de réinitialisation manquant')
      setSubmitting(false)
      return
    }

    try {
      const response = await api.post('/password/reset', {
        email: form.email,
        token,
        password: form.password,
        password_confirmation: form.password_confirmation
      })

      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-100 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-950">Mot de passe réinitialisé !</h2>
          <p className="mt-2 text-sm text-slate-500">Vous allez être redirigé vers la page de connexion.</p>
          <div className="mt-4">
            <Link to="/login" className="text-sm font-medium text-teal-600 hover:text-teal-500">
              Se connecter maintenant →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">

        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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
            <span className="bg-white px-4 font-medium text-slate-500">Nouveau mot de passe</span>
          </div>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError('')} />

        <form className="mt-6 space-y-5" onSubmit={submit}>
          <div>
            <label className="block text-sm font-medium text-slate-700">Adresse email</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 py-2.5 px-3 text-slate-500 cursor-not-allowed"
              type="email"
              value={form.email}
              readOnly
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Nouveau mot de passe</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              type="password"
              placeholder="Minimum 8 caractères"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Confirmer le mot de passe</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300 py-2.5 px-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              type="password"
              placeholder="Confirmer votre mot de passe"
              value={form.password_confirmation}
              onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-3">
            <Link
              to="/login"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Retour
            </Link>
            <button
              type="submit"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <KeyRound size={16} />
              )}
              {submitting ? 'Réinitialisation...' : 'Réinitialiser'}
            </button>
          </div>

          <p className="text-center text-xs text-slate-400">Lien valable 60 minutes</p>
        </form>
      </div>
    </div>
  )
}