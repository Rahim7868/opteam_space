import { Edit, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import api, { getApiError } from '../api/client'
import ConfirmModal from '../components/ConfirmModal'
import DataTable from '../components/DataTable'
import ErrorAlert from '../components/ErrorAlert'
import SuccessAlert from '../components/SuccessAlert'
import PageHeader from '../components/PageHeader'

const emptyForm = { direction_id: '', libelle: '', adresse: '', telephone: '', email: '' }

export default function Departements() {
  const [rows, setRows]             = useState([])
  const [directions, setDirections] = useState([])
  const [loading, setLoading]       = useState(true)
  const [form, setForm]             = useState(emptyForm)
  const [editing, setEditing]       = useState(null)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState('')
  const originalForm = useRef(null)
  const [search, setSearch]         = useState('')
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null })

  useEffect(() => {
    api.get('/directions').then(({ data }) => setDirections(data.data ?? data))
  }, [])

  function load() {
    setLoading(true)
    api.get('/departements')
      .then(({ data }) => setRows(data.data ?? data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function submit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      if (editing) {
        if (JSON.stringify(form) === JSON.stringify(originalForm.current)) {
          setForm(emptyForm); setEditing(null)
          return
        }
        await api.put(`/departements/${editing}`, form)
        setSuccess('Département mis à jour.')
      } else {
        await api.post('/departements', form)
        setSuccess('Département créé.')
      }
      setForm(emptyForm); setEditing(null); load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function destroy(id) {
    try {
      await api.delete(`/departements/${id}`)
      setSuccess('Département supprimé.')
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  function startEdit(row) {
    setEditing(row.id)
    setForm({
      direction_id: row.direction?.id ?? '',
      libelle:      row.libelle,
      adresse:      row.adresse ?? '',
      telephone:    row.telephone ?? '',
      email:        row.email ?? '',
    })
    originalForm.current = {
      direction_id: row.direction?.id ?? '',
      libelle:      row.libelle,
      adresse:      row.adresse ?? '',
      telephone:    row.telephone ?? '',
      email:        row.email ?? '',
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtered = rows.filter((r) =>
    r.libelle.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: 'libelle', label: 'Libellé' },
    {
      key: 'direction', label: 'Direction',
      render: (row) => row.direction?.libelle || <span className="text-slate-400">N/A</span>,
    },
    {
      key: 'telephone', label: 'Téléphone',
      render: (row) => row.telephone || <span className="text-slate-400">N/A</span>,
    },
    {
      key: 'email', label: 'Email',
      render: (row) => row.email || <span className="text-slate-400">N/A</span>,
    },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => startEdit(row)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <Edit size={13} /> Modifier
          </button>
          <button onClick={() => setConfirmModal({ open: true, id: row.id })}
            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100">
            <Trash2 size={13} /> Supprimer
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Départements" subtitle="Gestion des départements par direction." />

      <ErrorAlert message={error} onDismiss={() => setError('')} />
      <SuccessAlert message={success} onDismiss={() => setSuccess('')} />

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input className="field pl-9" placeholder="Rechercher un département..."
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <form onSubmit={submit}
        className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold text-slate-700">
          {editing ? 'Modifier le département' : 'Ajouter un département'}
        </h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <select className="field" value={form.direction_id}
            onChange={(e) => setForm({ ...form, direction_id: e.target.value })}
            required>
            <option value="">Sélectionner une direction *</option>
            {directions.map((d) => <option key={d.id} value={d.id}>{d.libelle}</option>)}
          </select>
          <input className="field" placeholder="Libellé *"
            value={form.libelle}
            onChange={(e) => setForm({ ...form, libelle: e.target.value })}
            required />
          <input className="field" placeholder="Adresse"
            value={form.adresse}
            onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
          <input className="field" placeholder="Téléphone"
            value={form.telephone}
            onChange={(e) => setForm({ ...form, telephone: e.target.value })} />
          <input className="field" type="email" placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
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