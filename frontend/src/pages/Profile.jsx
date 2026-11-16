import { ArrowRight, Check, KeyRound, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import api, { getApiError } from '../api/client'
import ErrorAlert from '../components/ErrorAlert'
import SuccessAlert from '../components/SuccessAlert'
import { useAuth } from '../context/AuthContext'

const emptyForm = {
  current_password: '',
  new_password: '',
  new_password_confirmation: '',
}

export default function Profile() {
  const { user } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const securityTips = [
    'Utilisez au moins 8 caractères.',
    'Choisissez un mot de passe unique à ce compte.',
    'Ne partagez jamais votre mot de passe.',
  ]

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
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="relative isolate overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 via-indigo-800 to-indigo-600 px-6 py-7 text-white shadow-lg shadow-indigo-950/15 sm:px-8 sm:py-9">
        <div className="absolute -right-12 -top-20 -z-10 h-64 w-64 rounded-full border-[32px] border-white/5" />
        <div className="absolute -bottom-28 right-24 -z-10 h-64 w-64 rounded-full bg-indigo-400/15 blur-2xl" />
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-3xl font-bold shadow-inner backdrop-blur">
            {user?.nom?.charAt(0)?.toUpperCase() ?? <UserRound size={32} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100">
              <ShieldCheck size={14} />
              Espace personnel
            </div>
            <h1 className="truncate text-2xl font-black tracking-tight sm:text-3xl">
              {user?.nom ?? 'Mon profil'}
            </h1>
            <p className="mt-1 truncate text-sm text-indigo-100 sm:text-base">
              {user?.email ?? 'Gérez les paramètres de votre compte'}
            </p>
          </div>
          <div className="flex items-center gap-2 self-start rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-3.5 py-2.5 text-sm font-semibold text-emerald-100 sm:self-center">
            <Check size={17} />
            Compte connecté
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(260px,0.8fr)]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-start gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <LockKeyhole size={21} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Sécurité du compte</h2>
              <p className="mt-1 text-sm text-slate-500">
                Modifiez votre mot de passe pour protéger votre accès.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <ErrorAlert message={error} onDismiss={() => setError('')} />
            <SuccessAlert message={success} onDismiss={() => setSuccess('')} />

            <form onSubmit={submit} className="space-y-5">
              <label className="block text-sm font-semibold text-slate-700">
                Mot de passe actuel
                <input
                  className="field mt-2"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={form.current_password}
                  onChange={(e) => setForm({ ...form, current_password: e.target.value })}
                />
              </label>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Nouveau mot de passe
                  <input
                    className="field mt-2"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={form.new_password}
                    onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                  />
                </label>

                <label className="block text-sm font-semibold text-slate-700">
                  Confirmer le nouveau mot de passe
                  <input
                    className="field mt-2"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={form.new_password_confirmation}
                    onChange={(e) => setForm({ ...form, new_password_confirmation: e.target.value })}
                  />
                </label>
              </div>

              <div className="flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-relaxed text-slate-500">
                  La modification prendra effet dès votre prochaine connexion.
                </p>
                <button className="btn btn-primary shrink-0" disabled={submitting}>
                  {submitting
                    ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    : <><KeyRound size={16} /> Mettre à jour</>
                  }
                  {submitting && 'Mise à jour...'}
                </button>
              </div>
            </form>
          </div>
        </section>

        <aside className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-white p-5 shadow-sm sm:p-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100">
            <ShieldCheck size={21} />
          </div>
          <h2 className="mt-4 text-lg font-bold text-slate-900">Renforcez votre sécurité</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Quelques bonnes habitudes aident à garder votre compte protégé.
          </p>
          <ul className="mt-5 space-y-3">
            {securityTips.map((tip) => (
              <li key={tip} className="flex gap-2.5 text-sm leading-relaxed text-slate-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                  <Check size={12} strokeWidth={3} />
                </span>
                {tip}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center gap-2 border-t border-indigo-100 pt-4 text-xs font-medium text-indigo-700">
            <ArrowRight size={14} />
            Vos informations restent confidentielles
          </div>
        </aside>
      </div>
    </div>
  )
}
