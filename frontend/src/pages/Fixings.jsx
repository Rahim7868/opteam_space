import { Check, Edit, Eye, FileDown, FileSpreadsheet, MessageSquare, Plus, Search, X, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import api, { getApiError } from '../api/client'
import ConfirmModal from '../components/ConfirmModal'
import DataTable from '../components/DataTable'
import IconActionButton from '../components/IconActionButton'
import ErrorAlert from '../components/ErrorAlert'
import FixingEvolutionChart from '../components/FixingEvolutionChart'
import SuccessAlert from '../components/SuccessAlert'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import ModificationReviewModal, { FIXING_FIELD_LABELS } from '../components/ModificationReviewModal'
import { RejectReasonModal, ViewReasonModal } from '../components/RejectReasonModal'
import DetailModal, { formatDate, formatDateOnly } from '../components/DetailModal'

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

  const canExportPdf = hasPermission('exporter_fixing_pdf')
  const canExportExcel = hasPermission('exporter_fixing_excel')

  const canApprouverModification = hasPermission('approuver_modification_fixing')

  // Admin peut modifier les fixings des autres
  const isAdmin = user?.role?.libelle === 'Admin' || (hasPermission('creer_acteurs') && hasPermission('modifier_acteurs'))

  const [rows, setRows]           = useState([])
  const [chartRows, setChartRows] = useState([])
  const [meta, setMeta]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [chartLoading, setChartLoading] = useState(true)
  const defaultFilters = { statut: '', devise: '', date_debut: '', date_fin: '', createur_id: '', page: 1 }
  const [filters, setFilters]     = useState(defaultFilters)
  const [form, setForm]           = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const originalForm = useRef(null)
  const [createurs, setCreateurs] = useState([])

  const [submitConfirm, setSubmitConfirm]     = useState(false)
  const [validateConfirm, setValidateConfirm] = useState({ open: false, id: null })
  const [rejectConfirm, setRejectConfirm]     = useState({ open: false, id: null })
  const [duplicateModal, setDuplicateModal]    = useState(false)
  const [reviewModal, setReviewModal]           = useState({ open: false, item: null })
  const [viewReasonModal, setViewReasonModal] = useState({ open: false, reason: '' })
  const [detailModal, setDetailModal]         = useState({ open: false, item: null })

  // Charger la liste des créateurs
  useEffect(() => {
    api.get('/users', { params: { per_page: 1000 } })
      .then(({ data }) => setCreateurs(data.data ?? []))
      .catch(() => {})
  }, [])

  function resetFilters() {
    setFilters(defaultFilters)
  }

  // Exports
  function exportPdf() {
    if (!canExportPdf) return
    const params = new URLSearchParams()
    if (filters.statut) params.append('statut', filters.statut)
    if (filters.devise) params.append('devise', filters.devise)
    if (filters.date_debut) params.append('date_debut', filters.date_debut)
    if (filters.date_fin) params.append('date_fin', filters.date_fin)
    if (filters.createur_id) params.append('createur_id', filters.createur_id)

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

  function exportExcel() {
    if (!canExportExcel) return
    const params = new URLSearchParams()
    if (filters.statut) params.append('statut', filters.statut)
    if (filters.devise) params.append('devise', filters.devise)
    if (filters.date_debut) params.append('date_debut', filters.date_debut)
    if (filters.date_fin) params.append('date_fin', filters.date_fin)
    if (filters.createur_id) params.append('createur_id', filters.createur_id)

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

  // API
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

  // CRUD
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
        const { data } = await api.post(`/fixings/${editingId}`, payload)
        setEditingId(null)
        setSuccess(data?.message || 'Modifications proposées. En attente de validation.')
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

  async function rejeter(id, commentaire = '') {
    try {
      await api.post(`/fixings/${id}/rejeter`, { commentaire })
      setSuccess('Fixing rejeté.')
      load()
      loadChartData()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function approuverModification(id) {
    try {
      await api.post(`/fixings/${id}/approuver-modification`)
      setSuccess('Modifications appliquées définitivement.')
      load()
      loadChartData()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function rejeterModification(id) {
    try {
      await api.post(`/fixings/${id}/rejeter-modification`)
      setSuccess('Modifications rejetées. Les données restent inchangées.')
      load()
      loadChartData()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  function startEditFixing(fixing) {
    setDetailModal({ open: false, item: null })
    setEditingId(fixing.id)
    const formData = {
      date_fixing: fixing.date_fixing,
      devise: fixing.devise,
      cours: String(fixing.cours ?? ''),
      piece_jointe: null,
    }
    setForm(formData)
    originalForm.current = { ...formData }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Colonnes
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
      key: 'statut',
      label: 'Statut',
      render: (row) => {
        let actorName = null
        const isModificationPending = row.statut_modification === 'en_attente_validation_modification'

        if (!isModificationPending && (row.statut === 'valide' || row.statut === 'rejete')) {
          if (row.validateur?.id && row.validateur?.id !== row.createur?.id) {
            actorName = row.validateur?.nom
          }
        }

        const showRejectReason = row.statut === 'rejete' && row.commentaire && !isModificationPending

        return (
          <div className="flex flex-col items-start gap-0.5">
            <StatusBadge status={isModificationPending ? 'en_attente_validation_modification' : row.statut} />
            {actorName && (
              <span className="text-[11px] italic text-slate-500 font-normal">
                {actorName}
              </span>
            )}
            {showRejectReason && (
              <IconActionButton
                icon={MessageSquare}
                label="Voir le motif"
                tone="danger"
                onClick={() => setViewReasonModal({ open: true, reason: row.commentaire })}
                className="mt-1 h-8 w-8"
              />
            )}
          </div>
        )
      },
    },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          {row.statut_modification === 'en_attente_validation_modification' && canApprouverModification ? (
            <IconActionButton
              icon={Eye}
              label="Voir les modifications"
              tone="info"
              onClick={() => setReviewModal({ open: true, item: row })}
            />
          ) : (
            <IconActionButton
              icon={Eye}
              label="Voir"
              onClick={() => setDetailModal({ open: true, item: row })}
            />
          )}
          {canModify && (row.statut === 'en_attente' || row.statut === 'rejete') && (isAdmin || row.createur?.id === user?.id) && (
            <IconActionButton
              icon={Edit}
              label="Modifier"
              onClick={() => startEditFixing(row)}
            />
          )}
          {canValidate && row.statut === 'en_attente' && (
            <IconActionButton
              icon={Check}
              label="Valider"
              tone="success"
              onClick={() => setValidateConfirm({ open: true, id: row.id })}
            />
          )}
          {canReject && row.statut === 'en_attente' && (
            <IconActionButton
              icon={X}
              label="Rejeter"
              tone="danger"
              onClick={() => setRejectConfirm({ open: true, id: row.id })}
            />
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
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <select
          className="field w-full"
          value={filters.devise}
          onChange={(e) => setFilters({ ...filters, devise: e.target.value, page: 1 })}
        >
          <option value="">Toutes les dévises</option>
          {currencies.map((c) => <option key={c}>{c}</option>)}
        </select>

        <select
          className="field w-full"
          value={filters.statut}
          onChange={(e) => setFilters({ ...filters, statut: e.target.value, page: 1 })}
        >
          <option value="">Tout les status</option>
          <option value="en_attente">En attente</option>
          <option value="valide">Validés</option>
          <option value="rejete">Rejetés</option>
        </select>

        <input
          type="date"
          className="field w-full"
          placeholder="Date début"
          value={filters.date_debut || ''}
          onChange={(e) => setFilters({ ...filters, date_debut: e.target.value, page: 1 })}
        />

        <input
          type="date"
          className="field w-full"
          placeholder="Date fin"
          value={filters.date_fin || ''}
          onChange={(e) => setFilters({ ...filters, date_fin: e.target.value, page: 1 })}
        />

        <select
          className="field w-full"
          value={filters.createur_id}
          onChange={(e) => setFilters({ ...filters, createur_id: e.target.value, page: 1 })}
        >
          <option value="">Tous les créateurs</option>
          {createurs.map((u) => (
            <option key={u.id} value={u.id}>{u.nom}</option>
          ))}
        </select>

        <button
          onClick={resetFilters}
          className="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 transition"
        >
          <RefreshCw size={14} /> Réinitialiser
        </button>
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

      {/* Modals */}
      <ConfirmModal
        open={submitConfirm}
        title={editingId ? 'Confirmer la modification ?' : 'Confirmer la création ?'}
        message={editingId ? 'Les modifications seront enregistrées définitivement.' : 'Êtes-vous sûr de vouloir créer cet élément ?'}
        confirmText={editingId ? 'Enregistrer' : 'Confirmer'}
        onConfirm={async () => { setSubmitConfirm(false); await submit() }}
        onCancel={() => setSubmitConfirm(false)}
      />

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

      <RejectReasonModal
        open={rejectConfirm.open}
        title="Refuser ce fixing"
        message="Êtes-vous sûr de vouloir refuser ce fixing ? Vous pouvez indiquer la raison du refus ci-dessous :"
        onConfirm={async (reason) => {
          const id = rejectConfirm.id
          setRejectConfirm({ open: false, id: null })
          await rejeter(id, reason)
        }}
        onCancel={() => setRejectConfirm({ open: false, id: null })}
      />

      <ViewReasonModal
        open={viewReasonModal.open}
        title="Motif du refus du fixing"
        reason={viewReasonModal.reason}
        onClose={() => setViewReasonModal({ open: false, reason: '' })}
      />

      <ModificationReviewModal
        open={reviewModal.open}
        item={reviewModal.item}
        fieldLabels={FIXING_FIELD_LABELS}
        onConfirm={async () => {
          const id = reviewModal.item?.id
          setReviewModal({ open: false, item: null })
          if (id) await approuverModification(id)
        }}
        onReject={async () => {
          const id = reviewModal.item?.id
          setReviewModal({ open: false, item: null })
          if (id) await rejeterModification(id)
        }}
        onClose={() => setReviewModal({ open: false, item: null })}
      />

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

      <DetailModal
        open={detailModal.open}
        onClose={() => setDetailModal({ open: false, item: null })}
        title={detailModal.item ? `${detailModal.item.devise} — ${formatDateOnly(detailModal.item.date_fixing)}` : 'Fixing'}
        fields={detailModal.item ? [
          { label: 'Date du fixing', value: formatDateOnly(detailModal.item.date_fixing) },
          { label: 'Devise', value: detailModal.item.devise },
          { label: 'Cours', value: formatAmount(detailModal.item.cours) },
          {
            label: 'Variation',
            value: detailModal.item.variation != null
              ? `${Number(detailModal.item.variation) > 0 ? '+' : ''}${formatAmount(detailModal.item.variation)}`
              : '—',
          },
          { label: 'Créateur', value: detailModal.item.createur?.nom ?? '—' },
          {
            label: 'Statut',
            value: <StatusBadge status={detailModal.item.statut} />,
          },
          ...(detailModal.item.statut === 'valide'
            ? [{ label: 'Validé par', value: detailModal.item.validateur?.nom ?? '—' }]
            : []),
          ...(detailModal.item.statut === 'rejete'
            ? [{ label: 'Refusé par', value: detailModal.item.validateur?.nom ?? '—' }]
            : []),
          ...(detailModal.item.statut === 'rejete' && detailModal.item.commentaire
            ? [{ label: 'Motif de rejet', value: detailModal.item.commentaire }]
            : []),
          {
            label: 'Pièce jointe',
            value: detailModal.item.piece_jointe_url ? (
              <a
                href={detailModal.item.piece_jointe_url}
                target="_blank"
                rel="noreferrer"
                className="text-teal-600 hover:underline text-xs font-semibold"
              >
                Voir la pièce jointe
              </a>
            ) : '—',
          },
          { label: 'Créé le', value: formatDate(detailModal.item.created_at) },
          { label: 'Mis à jour le', value: formatDate(detailModal.item.updated_at) },
        ] : []}
        footer={detailModal.item?.statut_modification !== 'en_attente_validation_modification' && detailModal.item && (
          <>
            {canValidate && detailModal.item.statut === 'en_attente' && (
              <IconActionButton
                icon={Check}
                label="Valider"
                tone="success"
                onClick={() => {
                  const id = detailModal.item.id
                  setDetailModal({ open: false, item: null })
                  setValidateConfirm({ open: true, id })
                }}
              />
            )}
            {canReject && detailModal.item.statut === 'en_attente' && (
              <IconActionButton
                icon={X}
                label="Rejeter"
                tone="danger"
                onClick={() => {
                  const id = detailModal.item.id
                  setDetailModal({ open: false, item: null })
                  setRejectConfirm({ open: true, id })
                }}
              />
            )}
            {canModify
              && ['en_attente', 'rejete'].includes(detailModal.item.statut)
              && (isAdmin || detailModal.item.createur?.id === user?.id) && (
                <IconActionButton
                  icon={Edit}
                  label="Modifier"
                  onClick={() => startEditFixing(detailModal.item)}
                />
              )}
          </>
        )}
      />
    </>
  )
}