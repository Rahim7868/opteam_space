import { Mail, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getApiError } from '../api/client'
import ErrorAlert from '../components/ErrorAlert'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      const response = await api.post('/password/email', { email })

      setSuccess(true)
      setEmail('')
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-100 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">

        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 shadow-lg">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
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
            <span className="bg-white px-4 font-medium text-slate-500">Mot de passe oublié</span>
          </div>
        </div>

        <ErrorAlert message={error} onDismiss={() => setError('')} />

        {success ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Email envoyé avec succès !</p>
                <p className="mt-1 text-sm text-green-700">Un lien de réinitialisation vous a été envoyé par email.</p>
                <div className="mt-4">
                  <Link to="/login" className="text-sm font-medium text-teal-600 hover:text-teal-500">
                    Retour à la connexion →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={submit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">Adresse email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  type="email"
                  placeholder="admin@opteam.gn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">Entrez votre email pour recevoir un lien de réinitialisation.</p>
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
                  <Mail size={16} />
                )}
                {submitting ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>

            <p className="text-center text-xs text-slate-400">Lien valable 60 minutes</p>
          </form>
        )}
      </div>
    </div>
  )
}