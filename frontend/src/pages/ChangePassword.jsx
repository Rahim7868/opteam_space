import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiError } from '../api/client'
import ErrorAlert from '../components/ErrorAlert'
import { useAuth } from '../context/AuthContext'

export default function ChangePassword() {
  const { changePassword, user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    new_password: '',
    new_password_confirmation: '',
  })
  const [error, setError]         = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')

    if (form.new_password !== form.new_password_confirmation) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    setSubmitting(true)
    try {
      await changePassword(form)
      navigate('/', { replace: true })
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
          <h1 className="mt-2 text-2xl font-black text-slate-950">
            Première connexion
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Bonjour <span className="font-semibold text-slate-700">{user?.nom}</span>,
            vous devez définir un nouveau mot de passe avant de continuer.
          </p>
        </div>

        <ErrorAlert message={error} />

        <form className="space-y-4" onSubmit={submit}>
          <label className="block text-sm font-semibold text-slate-700">
            Nouveau mot de passe
            <input
              className="field mt-1"
              type="password"
              minLength={8}
              value={form.new_password}
              onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Confirmer le mot de passe
            <input
              className="field mt-1"
              type="password"
              minLength={8}
              value={form.new_password_confirmation}
              onChange={(e) => setForm({ ...form, new_password_confirmation: e.target.value })}
            />
          </label>

          <button className="btn btn-primary w-full" disabled={submitting}>
            {submitting
              ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              : <KeyRound size={16} />
            }
            {submitting ? 'Enregistrement...' : 'Définir mon mot de passe'}
          </button>
        </form>

      </div>
    </div>
  )
}
