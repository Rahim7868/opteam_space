import { ArrowLeft, Edit, Mail, Paperclip, Pause, Play, Plus, Save, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import api, { getApiError } from '../api/client'
import ConfirmModal from '../components/ConfirmModal'
import ErrorAlert from '../components/ErrorAlert'
import SuccessAlert from '../components/SuccessAlert'

const emptyForm = {
  name: '',
  email: '',
  type: '',
  is_active: true,
  include_attachments: false,
}

const typeLabels = {
  daily: 'Quotidien',
  weekly: 'Hebdomadaire',
  monthly: 'Mensuel',
  daily_weekly: 'Quotidien + Hebdomadaire',
}

export default function ReportRecipients() {
  const [recipients, setRecipients] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchRecipients = useCallback(async () => {
    const { data } = await api.get('/report-recipients')
    return data.data
  }, [])

  const loadRecipients = useCallback(async () => {
    try {
      setRecipients(await fetchRecipients())
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }, [fetchRecipients])

  useEffect(() => {
    let active = true
    fetchRecipients()
      .then((data) => {
        if (active) setRecipients(data)
      })
      .catch((requestError) => {
        if (active) setError(getApiError(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [fetchRecipients])

  function openForm(recipient = null) {
    setError('')
    setSuccess('')
    setEditing(recipient?.id ?? null)
    setForm(recipient ? {
      name: recipient.name ?? '',
      email: recipient.email,
      type: recipient.type,
      is_active: recipient.is_active,
      include_attachments: recipient.include_attachments,
    } : { ...emptyForm })
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
    setForm({ ...emptyForm })
  }

  async function submitForm(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing) {
        await api.put(`/report-recipients/${editing}`, form)
        setSuccess('Destinataire modifié.')
      } else {
        await api.post('/report-recipients', form)
        setSuccess('Destinataire ajouté.')
      }
      closeForm()
      await loadRecipients()
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setSaving(false)
    }
  }

  async function updateRecipient(recipient, path, payload, successMessage) {
    setBusyId(recipient.id)
    setError('')
    setSuccess('')
    try {
      await api.patch(`/report-recipients/${recipient.id}/${path}`, payload)
      setSuccess(successMessage)
      await loadRecipients()
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setBusyId(null)
    }
  }

  async function deleteRecipient() {
    if (!deleting) return
    setBusyId(deleting.id)
    setError('')
    try {
      await api.delete(`/report-recipients/${deleting.id}`)
      setSuccess('Destinataire supprimé.')
      setDeleting(null)
      await loadRecipients()
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      <ErrorAlert message={error} onDismiss={() => setError('')} />
      <SuccessAlert message={success} onDismiss={() => setSuccess('')} />

      {formOpen ? (
        <section className="panel overflow-hidden">
          <header className="border-b border-slate-200 px-5 py-5 sm:px-8">
            <h1 className="text-xl font-bold text-slate-900">
              {editing ? 'Modifier un destinataire' : 'Ajouter un destinataire'}
            </h1>
          </header>
          <form onSubmit={submitForm} className="space-y-6 p-5 sm:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>Nom <span className="font-normal text-slate-500">(optionnel)</span></span>
                <input
                  className="field"
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Nom du destinataire"
                  maxLength={255}
                />
              </label>

              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>Email <span className="text-rose-600">*</span></span>
                <input
                  className="field"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="email@exemple.com"
                  maxLength={255}
                  required
                />
              </label>

              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>Type <span className="text-rose-600">*</span></span>
                <select
                  className="field"
                  value={form.type}
                  onChange={(event) => setForm({ ...form, type: event.target.value })}
                  required
                >
                  <option value="">Sélectionnez un type</option>
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium text-slate-700">Options</legend>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    className="h-4 w-4 accent-teal-700"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
                  />
                  Actif
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    className="h-4 w-4 accent-teal-700"
                    type="checkbox"
                    checked={form.include_attachments}
                    onChange={(event) => setForm({ ...form, include_attachments: event.target.checked })}
                  />
                  Inclure les pièces jointes (CSV/Excel)
                </label>
              </fieldset>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="btn btn-primary" type="submit" disabled={saving}>
                <Save size={16} />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button className="btn btn-accent" type="button" onClick={closeForm} disabled={saving}>
                <ArrowLeft size={16} />
                Retour
              </button>
            </div>
          </form>
        </section>
      ) : (
        <section className="panel overflow-hidden">
          <header className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 text-white">
                <Mail size={18} />
              </span>
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">Gestion des destinataires des rapports</h1>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => openForm()}>
              <Plus size={17} />
              Ajouter un destinataire
            </button>
          </header>

          <div className="overflow-x-auto p-4 sm:p-7">
            <table className="min-w-[850px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left font-bold text-slate-900">
                  <th className="px-2 py-3">Nom</th>
                  <th className="px-2 py-3">Email</th>
                  <th className="px-2 py-3">Type</th>
                  <th className="px-2 py-3 text-center">Pièces jointes</th>
                  <th className="px-2 py-3 text-center">Statut</th>
                  <th className="px-2 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td className="px-2 py-10 text-center text-slate-500" colSpan={6}>Chargement des destinataires...</td></tr>
                ) : recipients.length === 0 ? (
                  <tr><td className="px-2 py-10 text-center text-slate-500" colSpan={6}>Aucun destinataire. Ajoutez-en un pour configurer les rapports.</td></tr>
                ) : recipients.map((recipient, index) => (
                  <tr key={recipient.id} className={index % 2 === 0 ? 'bg-slate-100' : 'bg-white'}>
                    <td className="px-2 py-4 font-medium text-slate-900">{recipient.name || '—'}</td>
                    <td className="px-2 py-4 text-slate-800">{recipient.email}</td>
                    <td className="px-2 py-4">
                      <span className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold text-white ${
                        recipient.type === 'daily' ? 'bg-sky-500' : recipient.type === 'weekly' ? 'bg-indigo-700' : recipient.type === 'daily_weekly' ? 'bg-indigo-700' : 'bg-violet-600'
                      }`}>
                        {typeLabels[recipient.type] ?? recipient.type}
                      </span>
                    </td>
                    <td className="px-2 py-4 text-center">
                      <span className="inline-flex rounded-md bg-violet-500 px-3 py-1 text-xs font-semibold text-white">
                        {recipient.include_attachments ? 'Oui' : 'Non'}
                      </span>
                    </td>
                    <td className="px-2 py-4 text-center">
                      <span className={`inline-flex rounded-md px-3 py-1 text-xs font-semibold text-white ${
                        recipient.is_active ? 'bg-green-500' : 'bg-slate-500'
                      }`}>
                        {recipient.is_active ? 'Actif' : 'En pause'}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1">
                        <ActionButton
                          label="Modifier"
                          className="bg-amber-500 text-white hover:bg-amber-600"
                          onClick={() => openForm(recipient)}
                          disabled={busyId === recipient.id}
                        >
                          <Edit size={16} />
                        </ActionButton>
                        <ActionButton
                          label={recipient.is_active ? 'Mettre en pause' : 'Reprendre les envois'}
                          className="bg-violet-500 text-white hover:bg-violet-600"
                          onClick={() => updateRecipient(
                            recipient,
                            'status',
                            { is_active: !recipient.is_active },
                            recipient.is_active ? 'Destinataire mis en pause.' : 'Envois repris.',
                          )}
                          disabled={busyId === recipient.id}
                        >
                          {recipient.is_active ? <Pause size={16} /> : <Play size={16} />}
                        </ActionButton>
                        <ActionButton
                          label={recipient.include_attachments ? 'Désactiver les pièces jointes' : 'Activer les pièces jointes'}
                          className="bg-slate-300 text-slate-800 hover:bg-slate-400"
                          onClick={() => updateRecipient(
                            recipient,
                            'attachments',
                            { include_attachments: !recipient.include_attachments },
                            recipient.include_attachments ? 'Pièces jointes désactivées.' : 'Pièces jointes activées.',
                          )}
                          disabled={busyId === recipient.id}
                        >
                          <Paperclip size={16} />
                        </ActionButton>
                        <ActionButton
                          label="Supprimer"
                          className="bg-orange-500 text-white hover:bg-orange-600"
                          onClick={() => setDeleting(recipient)}
                          disabled={busyId === recipient.id}
                        >
                          <Trash2 size={16} />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <ConfirmModal
        open={Boolean(deleting)}
        title="Supprimer le destinataire"
        message={`Voulez-vous vraiment supprimer ${deleting?.email ?? 'ce destinataire'} ? Cette action est définitive.`}
        confirmText="Supprimer"
        danger
        onConfirm={deleteRecipient}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

function ActionButton({ label, className, children, ...props }) {
  return (
    <button
      {...props}
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}
