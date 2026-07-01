import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import api, { getApiError } from '../api/client'
import ErrorAlert from '../components/ErrorAlert'
import PageHeader from '../components/PageHeader'
import SuccessAlert from '../components/SuccessAlert'

const emptyForm = {
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
}

export default function Profile() {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    setSubmitting(true)
    try {
      const { data } = await api.put('/profile/password', form)
      setSuccess(data.message ?? 'Mot de passe mis à jour avec succès.')
      setForm(emptyForm)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Profil"
        subtitle="Mettez à jour le mot de passe de votre compte."
      />

      <ErrorAlert message={error} onDismiss={() => setError('')} />
      <SuccessAlert message={success} onDismiss={() => setSuccess('')} />

      <form onSubmit={submit} className="panel max-w-xl p-5">
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-700">
            Mot de passe actuel
            <input
              className="field mt-1"
              type="password"
              autoComplete="current-password"
              value={form.current_password}
              onChange={(e) => setForm({ ...form, current_password: e.target.value })}
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Nouveau mot de passe
            <input
              className="field mt-1"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={form.new_password}
              onChange={(e) => setForm({ ...form, new_password: e.target.value })}
            />
          </label>

          <label className="block text-sm font-semibold text-slate-700">
            Confirmation
            <input
              className="field mt-1"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={form.new_password_confirmation}
              onChange={(e) => setForm({ ...form, new_password_confirmation: e.target.value })}
            />
          </label>
        </div>

        <button className="btn btn-primary mt-5" disabled={submitting}>
          {submitting
            ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            : <KeyRound size={16} />
          }
          {submitting ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
        </button>
      </form>
    </>
  )
}
