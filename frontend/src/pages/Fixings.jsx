import { Check, Edit, FileDown, FileSpreadsheet, Plus, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import api, { getApiError } from '../api/client'
import ConfirmModal from '../components/ConfirmModal'
import DataTable from '../components/DataTable'
import ErrorAlert from '../components/ErrorAlert'
import FixingEvolutionChart from '../components/FixingEvolutionChart'
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

function formatAmount(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A'

  return Number(value).toLocaleString('fr-FR', {
    maximumFractionDigits: 6,
  })
}

export default function Fixings() {
  const { hasPermission, user } = useAuth()

  const canCreate   = hasPermission('creer_fixing')
  const canModify   = hasPermission('modifier_fixing')
  const canValidate = hasPermission('valider_fixing')
  const canReject   = hasPermission('rejeter_fixing')
  const canViewAll  = hasPermission('consulter_fixing')
  
  // 🔥 NOUVELLES PERMISSIONS
  const canExportPdf = hasPermission('exporter_fixing_pdf')
  const canExportExcel = hasPermission('exporter_fixing_excel')

  const [rows, setRows]           = useState([])
  const [chartRows, setChartRows] = useState([])
  const [meta, setMeta]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [chartLoading, setChartLoading] = useState(true)
  const [filters, setFilters]     = useState({ statut: '', devise: '', page: 1 })
  const [form, setForm]           = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const originalForm = useRef(null)

  // Confirmation modals
  const [submitConfirm, setSubmitConfirm]     = useState(false)
  const [validateConfirm, setValidateConfirm] = useState({ open: false, id: null })
  const [rejectConfirm, setRejectConfirm]     = useState({ open: false, id: null })
  const [duplicateModal, setDuplicateModal]    = useState(false)

  // Export PDF
  function exportPdf() {
    if (!canExportPdf) return
    const params = new URLSearchParams()
    if (filters.statut) params.append('statut', filters.statut)
    if (filters.devise) params.append('devise', filters.devise)
    
    api.get(`/export/fixings-pdf?${params.toString()}`, {
      responseType: 'blob'
    })
    .then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `fixings_${new Date().toISOString().slice(0, 10)}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    })
    .catch((err) => {
      setError(getApiError(err))
    })
  }

  // Export Excel
  function exportExcel() {
    if (!canExportExcel) return
    const params = new URLSearchParams()
    if (filters.statut) params.append('statut', filters.statut)
    if (filters.devise) params.append('devise', filters.devise)
    
    api.get(`/export/fixings-excel?${params.toString()}`, {
      responseType: 'blob'
    })
    .then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `fixings_${new Date().toISOString().slice(0, 10)}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    })
    .catch((err) => {
      setError(getApiError(err))
    })
  }

  function load() {
    setLoading(true)
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '')
    )
    api.get('/fixings', { params })
      .then(({ data }) => { setRows(data.data); setMeta(data.meta) })
      .finally(() => setLoading(false))
  }

  function loadChartData() {
    setChartLoading(true)
    api.get('/fixings', { params: { per_page: 500 } })
      .then(({ data }) => setChartRows(data.data))
      .finally(() => setChartLoading(false))
  }

  useEffect(load, [filters])
  useEffect(loadChartData, [])

  async function submit() {
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
        const { data } = await api.post('/fixings', payload)
        if (data?.error_code === 'DUPLICATE_FIXING') {
          setDuplicateModal(true)
          return
        }
        setSuccess('Fixing créé avec succès.')
      }
      setForm(emptyForm)
      load()
      loadChartData()
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.error_code === 'DUPLICATE_FIXING') {
        setDuplicateModal(true)
        return
      }
      setError(getApiError(err))
    }
  }

  async function valider(id) {
    try {
      await api.post(`/fixings/${id}/valider`)
      setSuccess('Fixing validé avec succès.')
      load()
      loadChartData()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function rejeter(id) {
    try {
      await api.post(`/fixings/${id}/rejeter`, {})
      setSuccess('Fixing rejeté.')
      load()
      loadChartData()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  const columns = [
    { key: 'date_fixing', label: 'Date' },
    { key: 'devise',      label: 'Devise' },
    {
      key: 'cours', label: 'Cours',
      render: (row) => <span className="font-semibold text-slate-900">{formatAmount(row.cours)}</span>,
    },
    {
      key: 'variation', label: 'Variation',
      render: (row) => {
        if (row.variation === null || row.variation === undefined) {
          return <span className="text-slate-400 text-xs">N/A</span>
        }
        const v = Number(row.variation)
        if (v === 0) return <span className="text-slate-500 text-xs">0</span>
        return (
          <span className={`font-semibold text-xs ${v > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {v > 0 ? '+' : ''}{formatAmount(v)}
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
              onClick={() => setValidateConfirm({ open: true, id: row.id })}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 transition"
            >
              <Check size={13} /> Valider
            </button>
          )}
          {canReject && row.statut === 'en_attente' && (
            <button
              onClick={() => setRejectConfirm({ open: true, id: row.id })}
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
        subtitle={
          canViewAll
            ? "Consultation de tous les fixings du système."
            : "Consultation de vos fixings uniquement."
        }
        action={
          <div className="flex gap-2">
            <button
              onClick={exportPdf}
              disabled={!canExportPdf}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all ${
                canExportPdf
                  ? 'bg-red-500 hover:bg-red-600 hover:shadow-md cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              <FileDown size={16} /> PDF
            </button>
            <button
              onClick={exportExcel}
              disabled={!canExportExcel}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all ${
                canExportExcel
                  ? 'bg-green-600 hover:bg-green-700 hover:shadow-md cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              <FileSpreadsheet size={16} /> Excel
            </button>
          </div>
        }
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
          onSubmit={(e) => { e.preventDefault(); setSubmitConfirm(true) }}
          className="panel animate-enter mb-5 grid gap-3 p-5 md:grid-cols-4"
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
                className="btn btn-secondary"
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

      <FixingEvolutionChart fixings={chartRows} loading={chartLoading} />

      {/* Modal confirmation création/modification */}
      <ConfirmModal
        open={submitConfirm}
        title={editingId ? 'Confirmer la modification ?' : 'Confirmer la création ?'}
        message={editingId ? 'Les modifications seront enregistrées définitivement.' : 'Êtes-vous sûr de vouloir créer cet élément ?'}
        confirmText={editingId ? 'Enregistrer' : 'Confirmer'}
        onConfirm={async () => { setSubmitConfirm(false); await submit() }}
        onCancel={() => setSubmitConfirm(false)}
      />

      {/* Modal confirmation validation */}
      <ConfirmModal
        open={validateConfirm.open}
        title="Confirmer l'approbation ?"
        message="Êtes-vous sûr de vouloir approuver ce fixing ?"
        confirmText="Approuver"
        onConfirm={async () => {
          const id = validateConfirm.id
          setValidateConfirm({ open: false, id: null })
          await valider(id)
        }}
        onCancel={() => setValidateConfirm({ open: false, id: null })}
      />

      {/* Modal confirmation rejet */}
      <ConfirmModal
        open={rejectConfirm.open}
        title="Confirmer le refus ?"
        message="Êtes-vous sûr de vouloir refuser ce fixing ?"
        danger
        confirmText="Refuser"
        onConfirm={async () => {
          const id = rejectConfirm.id
          setRejectConfirm({ open: false, id: null })
          await rejeter(id)
        }}
        onCancel={() => setRejectConfirm({ open: false, id: null })}
      />

      {/* Modal Fixing doublon */}
      {duplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800">Fixing déjà existant</h3>
            <p className="mt-2 text-sm text-slate-500">
              Un fixing pour cette devise existe déjà à cette date.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => { setDuplicateModal(false); setForm(emptyForm) }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
              >
                Voir la liste des fixings
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}