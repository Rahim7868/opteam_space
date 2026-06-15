import { LogIn } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { getApiError } from '../api/client'
import ErrorAlert from '../components/ErrorAlert'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, user } = useAuth()
  const [form, setForm] = useState({ email: 'admin@opteam.test', password: 'password' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await login(form)
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
          <div className="text-sm font-bold uppercase tracking-wider text-teal-700">OPTEAM_SPACE</div>
          <h1 className="mt-2 text-2xl font-black text-slate-950">Connexion</h1>
          <p className="mt-2 text-sm text-slate-500">Gestion des fixings de change pour bureaux de change.</p>
        </div>
        <ErrorAlert message={error} />
        <form className="space-y-4" onSubmit={submit}>
          <label className="block text-sm font-semibold text-slate-700">
            Email
            <input className="field mt-1" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label className="block text-sm font-semibold text-slate-700">
            Mot de passe
            <input
              className="field mt-1"
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </label>
          <button className="btn btn-primary w-full" disabled={submitting}>
            <LogIn size={16} />
            Se connecter
          </button>
        </form>
      </div>
    </div>
  )
}
