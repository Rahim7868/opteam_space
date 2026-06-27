import { Check, Plus, Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getApiError } from '../api/client'
import DataTable from '../components/DataTable'
import ErrorAlert from '../components/ErrorAlert'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import ConfirmModal from '../components/ConfirmModal'
import { useAuth } from '../context/AuthContext'

const emptyForm = {
  date_fixing: new Date().toISOString().slice(0, 10),
  devise: 'EUR',
  cours: '',
  piece_jointe: null,
}

const currencies = ['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'XOF']

export default function Fixings() {
  const { hasPermission } = useAuth()

  const canCreate   = hasPermission('creer_fixing')
  const canModify   = hasPermission('modifier_fixing')
  const canValidate = hasPermission('valider_fixing')
  const canReject   = hasPermission('rejeter_fixing')

  const [rows, setRows]     = useState([])
  const [meta, setMeta]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ statut: '', devise: '', page: 1 })
  const [form, setForm]     = useState(emptyForm)
  const [error, setError]   = useState('')

  // Modal rejet
  const [rejectModal, setRejectModal] = useState({ open: false, id: null })
  const [commentaire, setCommentaire] = useState('')

  function load() {
    setLoading(true)
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '')
    )
    api.get('/fixings', { params })
      .then(({ data }) => { setRows(data.data); setMeta(data.meta) })
      .finally(() => setLoading(false))
  }

  useEffect(load, [filters])

  async function submit(e) {
    e.preventDefault()
    setError('')
    const payload = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) payload.append(k, v) })
    try {
      await api.post('/fixings', payload)
      setForm(emptyForm)
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function valider(id) {
    try {
      await api.post(`/fixings/${id}/valider`)
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function rejeter() {
    try {
      await api.post(`/fixings/${rejectModal.id}/rejeter`, { commentaire })
      setRejectModal({ open: false, id: null })
      setCommentaire('')
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  const columns = [
    { key: 'date_fixing', label: 'Date' },
    { key: 'devise',      label: 'Devise' },
    {
      key: 'cours', label: 'Cours',
      render: (row) => Number(row.cours).toFixed(4),
    },
    {
      key: 'piece_jointe', label: 'Fichier',
      render: (row) => row.piece_jointe_url
        ? <a href={row.piece_jointe_url} target="_blank" rel="noreferrer"
             className="text-teal-600 hover:underline text-xs">Voir</a>
        : <span className="text-slate-400">—</span>,
    },
    {
      key: 'createur', label: 'Créateur',
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
          {canValidate && row.statut === 'en_attente' && (
            <button
              onClick={() => valider(row.id)}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 transition"
            >
              <Check size={13} /> Valider
            </button>
          )}
          {canReject && row.statut === 'en_attente' && (
            <button
              onClick={() => setRejectModal({ open: true, id: row.id })}
              className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 transition"
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
        title="Fixings"
        subtitle="Création et suivi des fixings de change."
      />

      <ErrorAlert message={error} />

      {/* Filtres */}
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <select
            className="field pl-9"
            value={filters.devise}
            onChange={(e) => setFilters({ ...filters, devise: e.target.value, page: 1 })}
          >
            <option value="">Toutes devises</option>
            {currencies.map((c) => <option key={c}>{c}</option>)}
          </select>
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

      {/* Formulaire création */}
      {canCreate && (
        <form
          onSubmit={submit}
          className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm grid gap-3 md:grid-cols-4"
        >
          <input
            type="date"
            className="field"
            value={form.date_fixing}
            onChange={(e) => setForm({ ...form, date_fixing: e.target.value })}
          />
          <select
            className="field"
            value={form.devise}
            onChange={(e) => setForm({ ...form, devise: e.target.value })}
          >
            {currencies.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input
            className="field"
            placeholder="Cours (ex: 655.957)"
            value={form.cours}
            onChange={(e) => setForm({ ...form, cours: e.target.value })}
          />
          <input
            type="file"
            className="field"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setForm({ ...form, piece_jointe: e.target.files[0] })}
          />
          <button className="btn btn-primary col-span-full md:col-span-4">
            <Plus size={16} /> Ajouter un fixing
          </button>
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
            <h3 className="text-lg font-semibold text-slate-800">Rejeter le fixing</h3>
            <p className="mt-1 text-sm text-slate-500">Indiquez un motif de rejet (optionnel).</p>
            <textarea
              className="field mt-4 h-24 resize-none"
              placeholder="Motif du rejet..."
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
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
