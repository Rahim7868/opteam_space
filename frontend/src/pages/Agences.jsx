import { Edit, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getApiError } from '../api/client'
import ConfirmModal from '../components/ConfirmModal'
import DataTable from '../components/DataTable'
import ErrorAlert from '../components/ErrorAlert'
import SuccessAlert from '../components/SuccessAlert'
import PageHeader from '../components/PageHeader'

const emptyForm = { libelle: '', adresse: '', telephone: '', email: '' }

export default function Agences() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch]   = useState('')
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null })

  function load() {
    setLoading(true)
    api.get('/agences')
      .then(({ data }) => setRows(data.data ?? data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function submit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      if (editing) {
        await api.put(`/agences/${editing}`, form)
        setSuccess('Agence mise à jour.')
      } else {
        await api.post('/agences', form)
        setSuccess('Agence créée.')
      }
      setForm(emptyForm); setEditing(null); load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function destroy(id) {
    try {
      await api.delete(`/agences/${id}`)
      setSuccess('Agence supprimée.')
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  function startEdit(row) {
    setEditing(row.id)
    setForm({ libelle: row.libelle, adresse: row.adresse ?? '', telephone: row.telephone ?? '', email: row.email ?? '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtered = rows.filter((r) =>
    r.libelle.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: 'libelle',   label: 'Libellé' },
    { key: 'adresse',   label: 'Adresse' },
    { key: 'telephone', label: 'Téléphone' },
    { key: 'email',     label: 'Email' },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => startEdit(row)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Edit size={13} /> Modifier
          </button>
          <button
            onClick={() => setConfirmModal({ open: true, id: row.id })}
            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
          >
            <Trash2 size={13} /> Supprimer
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Agences" subtitle="Gestion des agences." />

      <ErrorAlert message={error} onDismiss={() => setError('')} />
      <SuccessAlert message={success} onDismiss={() => setSuccess('')} />

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input className="field pl-9" placeholder="Rechercher une agence..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <form onSubmit={submit}
        className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-700">
          {editing ? 'Modifier l\'agence' : 'Ajouter une agence'}
        </h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <input className="field" placeholder="Libellé *"
            value={form.libelle} onChange={(e) => setForm({ ...form, libelle: e.target.value })} />
          <input className="field" placeholder="Adresse"
            value={form.adresse} onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
          <input className="field" placeholder="Téléphone"
            value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
          <input className="field" type="email" placeholder="Email"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="mt-3 flex gap-2">
          <button className="btn btn-primary">
            <Plus size={16} /> {editing ? 'Enregistrer' : 'Ajouter'}
          </button>
          {editing && (
            <button type="button"
              onClick={() => { setEditing(null); setForm(emptyForm) }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Annuler
            </button>
          )}
        </div>
      </form>

      <DataTable columns={columns} rows={filtered} loading={loading} />

      <ConfirmModal
        open={confirmModal.open}
        title="Confirmer la suppression"
        message="Cette action est irréversible."
        danger={true}
        onConfirm={async () => {
          await destroy(confirmModal.id)
          setConfirmModal({ open: false, id: null })
        }}
        onCancel={() => setConfirmModal({ open: false, id: null })}
      />
    </>
  )
}
