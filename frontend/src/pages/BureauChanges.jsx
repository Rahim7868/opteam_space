import { Check, Edit, Plus, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getApiError } from '../api/client'
import DataTable from '../components/DataTable'
import ErrorAlert from '../components/ErrorAlert'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'

const emptyForm = {
  designation: '', numero_agrement: '',
  representant_legal: '', contact: '', adresse: '',
}

export default function BureauChanges() {
  // ✅ Ajout de user
  const { hasPermission, user } = useAuth()

  const canCreate   = hasPermission('creer_bureau_change')
  const canModify   = hasPermission('modifier_bureau_change')
  const canValidate = hasPermission('valider_bureau_change')
  const canReject   = hasPermission('rejeter_bureau_change')

  const [rows, setRows]       = useState([])
  const [meta, setMeta]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', statut: '', page: 1 })
  const [form, setForm]       = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [error, setError]     = useState('')

  const [rejectModal, setRejectModal] = useState({ open: false, id: null })
  const [commentaire, setCommentaire] = useState('')

  function load() {
    setLoading(true)
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '')
    )
    api.get('/bureau-changes', { params })
      .then(({ data }) => { setRows(data.data); setMeta(data.meta) })
      .finally(() => setLoading(false))
  }

  useEffect(load, [filters])

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      if (editing) await api.put(`/bureau-changes/${editing}`, form)
      else         await api.post('/bureau-changes', form)
      setForm(emptyForm); setEditing(null); load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function valider(id) {
    try {
      await api.post(`/bureau-changes/${id}/valider`)
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function rejeter() {
    try {
      await api.post(`/bureau-changes/${rejectModal.id}/rejeter`, { commentaire })
      setRejectModal({ open: false, id: null }); setCommentaire(''); load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  function startEdit(row) {
    setEditing(row.id)
    setForm({
      designation:        row.designation,
      numero_agrement:    row.numero_agrement,
      representant_legal: row.representant_legal,
      contact:            row.contact ?? '',
      adresse:            row.adresse ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const columns = [
    { key: 'designation',        label: 'Désignation' },
    { key: 'numero_agrement',    label: 'N° Agrément' },
    { key: 'representant_legal', label: 'Représentant' },
    { key: 'contact',            label: 'Contact' },
    {
      key: 'createur', label: 'Créé par',
      render: (row) => row.createur?.nom ?? '—',
    },
    {
      key: 'statut', label: 'Statut',
      render: (row) => <StatusBadge status={row.statut} />,
    },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {/* ✅ Modifier uniquement ses propres bureaux de change */}
          {canModify && row.statut === 'en_attente' && row.createur?.id === user?.id && (
            <button
              onClick={() => startEdit(row)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Edit size={13} /> Modifier
            </button>
          )}
          {canValidate && row.statut === 'en_attente' && (
            <button
              onClick={() => valider(row.id)}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
            >
              <Check size={13} /> Valider
            </button>
          )}
          {canReject && row.statut === 'en_attente' && (
            <button
              onClick={() => setRejectModal({ open: true, id: row.id })}
              className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
            >
              <X size={13} /> Rejeter
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Bureaux de change"
        subtitle="Gestion et validation des bureaux de change."
      />

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Filtres */}
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            className="field pl-9"
            placeholder="Rechercher par désignation ou agrément..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>
        <select
          className="field"
          value={filters.statut}
          onChange={(e) => setFilters({ ...filters, statut: e.target.value, page: 1 })}
        >
          <option value="">Tous statuts</option>
          <option value="en_attente">En attente</option>
          <option value="valide">Validés</option>
          <option value="rejete">Rejetés</option>
        </select>
      </div>

      {/* Formulaire */}
      {(canCreate || (canModify && editing)) && (
        <form
          onSubmit={submit}
          className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <h3 className="mb-3 text-sm font-bold text-slate-700">
            {editing ? 'Modifier le bureau de change' : 'Ajouter un bureau de change'}
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <input className="field" placeholder="Désignation"
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            <input className="field" placeholder="N° Agrément"
              value={form.numero_agrement}
              onChange={(e) => setForm({ ...form, numero_agrement: e.target.value })} />
            <input className="field" placeholder="Représentant légal"
              value={form.representant_legal}
              onChange={(e) => setForm({ ...form, representant_legal: e.target.value })} />
            <input className="field" placeholder="Contact"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            <input className="field" placeholder="Adresse"
              value={form.adresse}
              onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn btn-primary">
              <Plus size={16} />
              {editing ? 'Enregistrer' : 'Ajouter'}
            </button>
            {editing && (
              <button type="button"
                onClick={() => { setEditing(null); setForm(emptyForm) }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        meta={meta}
        loading={loading}
        onPage={(page) => setFilters({ ...filters, page })}
      />

      {/* Modal rejet */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800">Rejeter le bureau de change</h3>
            <p className="mt-1 text-sm text-slate-500">Motif du rejet (optionnel).</p>
            <textarea
              className="field mt-4 h-24 resize-none"
              placeholder="Motif..."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => { setRejectModal({ open: false, id: null }); setCommentaire('') }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={rejeter}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
