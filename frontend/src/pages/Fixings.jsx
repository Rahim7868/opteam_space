import { Check, Edit, Plus, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import api, { getApiError } from '../api/client'
import DataTable from '../components/DataTable'
import ErrorAlert from '../components/ErrorAlert'
import SuccessAlert from '../components/SuccessAlert'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'

const emptyForm = {
  date_fixing: new Date().toISOString().slice(0, 10),
  devise: 'EUR',
  cours: '',
  piece_jointe: null,
}

const currencies = ['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'XOF']

export default function Fixings() {
  //  Ajout de user
  const { hasPermission, user } = useAuth()

  const canCreate   = hasPermission('creer_fixing')
  const canModify   = hasPermission('modifier_fixing')
  const canValidate = hasPermission('valider_fixing')
  const canReject   = hasPermission('rejeter_fixing')

  const [rows, setRows]           = useState([])
  const [meta, setMeta]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [filters, setFilters]     = useState({ statut: '', devise: '', page: 1 })
  const [form, setForm]           = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const originalForm = useRef(null)

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
    setSuccess('')

    if (editingId && JSON.stringify(form) === JSON.stringify(originalForm.current)) {
      setEditingId(null); setForm(emptyForm)
      return
    }

    const payload = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) payload.append(k, v) })

    try {
      if (editingId) {
        payload.append('_method', 'PUT')
        await api.post(`/fixings/${editingId}`, payload)
        setEditingId(null)
        setSuccess('Fixing modifié avec succès.')
      } else {
        await api.post('/fixings', payload)
        setSuccess('Fixing créé avec succès.')
      }
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

  async function rejeter(id) {
    try {
      await api.post(`/fixings/${id}/rejeter`, {})
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
      key: 'variation', label: 'Variation',
      render: (row) => {
        if (row.variation === null || row.variation === undefined) {
          return <span className="text-slate-400 text-xs">N/A</span>
        }
        const v = Number(row.variation)
        if (v === 0) return <span className="text-slate-500 text-xs">0.0000</span>
        return (
          <span className={`font-semibold text-xs ${v > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {v > 0 ? '+' : ''}{v.toFixed(4)}
          </span>
        )
      },
    },
    {
      key: 'piece_jointe', label: 'Fichier',
      render: (row) => row.piece_jointe_url
        ? <a href={row.piece_jointe_url} target="_blank" rel="noreferrer"
             className="text-teal-600 hover:underline text-xs">Voir fichier</a>
        : <span className="text-slate-400">N/A</span>,
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
          {/*Modifier uniquement ses propres fixings */}
          {canModify && row.statut === 'en_attente' && row.createur?.id === user?.id && (
            <button
              onClick={() => {
                setEditingId(row.id)
                setForm({
                  date_fixing:  row.date_fixing,
                  devise:       row.devise,
                  cours:        row.cours,
                  piece_jointe: null,
                })
                originalForm.current = {
                  date_fixing:  row.date_fixing,
                  devise:       row.devise,
                  cours:        row.cours,
                  piece_jointe: null,
                }
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Edit size={13} /> Modifier
            </button>
          )}
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
              onClick={() => rejeter(row.id)}
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

      <ErrorAlert message={error} onDismiss={() => setError('')} />
      <SuccessAlert message={success} onDismiss={() => setSuccess('')} />

      {/* Filtres */}
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
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

      {/* Formulaire création/modification */}
      {(canCreate || (canModify && editingId)) && (
        <form
          onSubmit={submit}
          className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm grid gap-3 md:grid-cols-4"
        >
          <input
            type="date"
            className="field"
            value={form.date_fixing}
            onChange={(e) => setForm({ ...form, date_fixing: e.target.value })}
            required
          />
          <select
            className="field"
            value={form.devise}
            onChange={(e) => setForm({ ...form, devise: e.target.value })}
            required
          >
            {currencies.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input
            className="field"
            placeholder="Cours (ex: 655.957) *"
            value={form.cours}
            onChange={(e) => setForm({ ...form, cours: e.target.value })}
            required
          />
          <input
            type="file"
            className="field"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setForm({ ...form, piece_jointe: e.target.files[0] })}
          />
          <div className="col-span-full flex gap-2">
            <button className="btn btn-primary flex-1">
              <Plus size={16} />
              {editingId ? 'Enregistrer les modifications' : 'Ajouter un fixing'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setForm(emptyForm) }}
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

    </>
  )
}
