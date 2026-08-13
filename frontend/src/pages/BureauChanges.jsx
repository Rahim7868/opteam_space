import { Check, Edit, Eye, FileDown, FileSpreadsheet, MessageSquare, Plus, Search, Upload, X, RefreshCw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import api, { getApiError } from '../api/client'
import ConfirmModal from '../components/ConfirmModal'
import DataTable from '../components/DataTable'
import ErrorAlert from '../components/ErrorAlert'
import SuccessAlert from '../components/SuccessAlert'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'
import ModificationReviewModal, { BUREAU_FIELD_LABELS } from '../components/ModificationReviewModal'
import { RejectReasonModal, ViewReasonModal } from '../components/RejectReasonModal'

const emptyForm = {
  numero_ordre: '', designation: '', numero_agrement: '',
  date_expiration_agrement: '',
  representant_legal: '', contact: '', adresse: '',
}

export default function BureauChanges() {
  const { hasPermission, user } = useAuth()

  const canCreate   = hasPermission('creer_bureau_change')
  const canModify   = hasPermission('modifier_bureau_change')
  const canValidate = hasPermission('valider_bureau_change')
  const canReject   = hasPermission('rejeter_bureau_change')
  const canViewAll  = hasPermission('consulter_bureau_change')

  const canExportPdf = hasPermission('exporter_bureau_pdf')
  const canExportExcel = hasPermission('exporter_bureau_excel')
  const canImport = hasPermission('importer_bureau')

  const canApprouverModification = hasPermission('approuver_modification_bureau')

  // Admin peut modifier les bureaux des autres
  const isAdmin = user?.role?.libelle === 'Admin' || (hasPermission('creer_acteurs') && hasPermission('modifier_acteurs'))

  const [rows, setRows]       = useState([])
  const [meta, setMeta]       = useState(null)
  const [loading, setLoading] = useState(true)
  const defaultFilters = { search: '', statut: '', createur_id: '', page: 1 }
  const [filters, setFilters] = useState(defaultFilters)
  const [form, setForm]       = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const originalForm          = useRef(null)
  const [createurs, setCreateurs] = useState([])

  // Import Excel
  const [importModal, setImportModal]   = useState(false)
  const [importFile, setImportFile]     = useState(null)
  const [importing, setImporting]       = useState(false)
  const [importResult, setImportResult] = useState(null)

  // Confirmation modals
  const [submitConfirm, setSubmitConfirm]       = useState(false)
  const [validateConfirm, setValidateConfirm]   = useState({ open: false, id: null })
  const [rejectConfirm, setRejectConfirm]       = useState({ open: false, id: null })
  const [reviewModal, setReviewModal]           = useState({ open: false, item: null })
  const [viewReasonModal, setViewReasonModal] = useState({ open: false, reason: '' })

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
    if (filters.search) params.append('search', filters.search)
    if (filters.statut) params.append('statut', filters.statut)
    if (filters.createur_id) params.append('createur_id', filters.createur_id)

    api.get(`/export/bureau-changes-pdf?${params.toString()}`, {
      responseType: 'blob'
    })
    .then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `bureaux_change_${new Date().toISOString().slice(0, 10)}.pdf`)
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
    if (filters.search) params.append('search', filters.search)
    if (filters.statut) params.append('statut', filters.statut)
    if (filters.createur_id) params.append('createur_id', filters.createur_id)

    api.get(`/export/bureau-changes-excel?${params.toString()}`, {
      responseType: 'blob'
    })
    .then((response) => {
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `bureaux_change_${new Date().toISOString().slice(0, 10)}.xlsx`)
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
    api.get('/bureau-changes', { params })
      .then(({ data }) => { setRows(data.data); setMeta(data.meta) })
      .finally(() => setLoading(false))
  }

  useEffect(load, [filters])

  // CRUD
  async function submit() {
    setError(''); setSuccess('')
    try {
      if (editing) {
        if (JSON.stringify(form) === JSON.stringify(originalForm.current)) {
          setForm(emptyForm); setEditing(null)
          return
        }
        const { data } = await api.put(`/bureau-changes/${editing}`, form)
        setSuccess(data?.message || 'Modifications proposées. En attente de validation.')
      } else {
        await api.post('/bureau-changes', form)
        setSuccess('Bureau de change créé avec succès.')
      }
      setForm(emptyForm); setEditing(null); load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function valider(id) {
    try {
      await api.post(`/bureau-changes/${id}/valider`)
      setSuccess('Bureau de change validé.')
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function rejeter(id, commentaire = '') {
    try {
      await api.post(`/bureau-changes/${id}/rejeter`, { commentaire })
      setSuccess('Bureau de change rejeté.')
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function approuverModification(id) {
    try {
      await api.post(`/bureau-changes/${id}/approuver-modification`)
      setSuccess('Modifications appliquées définitivement.')
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function rejeterModification(id) {
    try {
      await api.post(`/bureau-changes/${id}/rejeter-modification`)
      setSuccess('Modifications rejetées. Les données restent inchangées.')
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  function startEdit(row) {
    setEditing(row.id)
    const data = {
      numero_ordre:       row.numero_ordre ?? '',
      designation:        row.designation,
      numero_agrement:    row.numero_agrement,
      date_expiration_agrement: row.date_expiration_agrement || '',
      representant_legal: row.representant_legal,
      contact:            row.contact ?? '',
      adresse:            row.adresse ?? '',
    }
    setForm(data)
    originalForm.current = { ...data }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Import
  async function handleImport(e) {
    e.preventDefault()
    if (!importFile) return

    setImporting(true)
    setImportResult(null)

    const payload = new FormData()
    payload.append('fichier', importFile)

    try {
      const { data } = await api.post('/bureau-changes/import', payload)
      setImportResult(data)
      load()
    } catch (err) {
      setError(getApiError(err))
      setImportModal(false)
    } finally {
      setImporting(false)
    }
  }

  // Colonnes
  const columns = [
    { key: 'numero_ordre',       label: 'N° Ordre' },
    { key: 'designation',        label: 'Désignation' },
    { key: 'numero_agrement',    label: 'N° Agrément' },
    {
      key: 'expiration',
      label: 'Expiration agrément',
      render: (row) => {
        if (!row.date_expiration_agrement) {
          return <span className="text-slate-400 text-xs">—</span>
        }

        const expiration = new Date(row.date_expiration_agrement)
        const now = new Date()
        const daysLeft = Math.ceil((expiration - now) / (1000 * 60 * 60 * 24))

        if (daysLeft < 0) {
          return <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-rose-200">Expiré</span>
        }

        if (daysLeft <= 30) {
          return <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">Expire dans {daysLeft} jour{daysLeft > 1 ? 's' : ''}</span>
        }

        return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">Valide</span>
      }
    },
    { key: 'representant_legal', label: 'Représentant' },
    {
      key: 'contact', label: 'Contact',
      render: (row) => row.contact || <span className="text-slate-400">N/A</span>,
    },
    {
      key: 'adresse', label: 'Adresse',
      render: (row) => row.adresse || <span className="text-slate-400">N/A</span>,
    },
    {
      key: 'createur', label: 'Créé par',
      render: (row) => row.createur?.nom ?? <span className="text-slate-400">N/A</span>,
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
            {isModificationPending ? (
              <StatusBadge status="en_attente_validation_modification" />
            ) : (
              <StatusBadge status={row.statut} />
            )}
            {actorName && (
              <span className="text-[11px] italic text-slate-500 font-normal">
                {actorName}
              </span>
            )}
            {showRejectReason && (
              <button
                onClick={() => setViewReasonModal({ open: true, reason: row.commentaire })}
                className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:underline"
              >
                <MessageSquare size={12} /> Voir le motif
              </button>
            )}
          </div>
        )
      },
    },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {canModify && (row.statut === 'en_attente' || row.statut === 'rejete') && (isAdmin || row.createur?.id === user?.id) && (
            <button onClick={() => startEdit(row)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
              <Edit size={13} /> Modifier
            </button>
          )}
          {canValidate && row.statut === 'en_attente' && (
            <button onClick={() => setValidateConfirm({ open: true, id: row.id })}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100">
              <Check size={13} /> Valider
            </button>
          )}
          {canReject && row.statut === 'en_attente' && (
            <button onClick={() => setRejectConfirm({ open: true, id: row.id })}
              className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100">
              <X size={13} /> Rejeter
            </button>
          )}
          {canApprouverModification && row.statut_modification === 'en_attente_validation_modification' && (
            <button
              onClick={() => setReviewModal({ open: true, item: row })}
              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100 transition"
            >
              <Eye size={13} /> Voir les modifications
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
        subtitle={
          canViewAll
            ? "Consultation de tous les bureaux de change du système."
            : "Consultation de vos bureaux de change uniquement."
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
            <button
              onClick={() => { setImportModal(true); setImportResult(null); setImportFile(null) }}
              disabled={!canImport}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all ${
                canImport
                  ? 'bg-teal-600 hover:bg-teal-700 hover:shadow-md cursor-pointer'
                  : 'bg-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              <Upload size={16} /> Importer Excel
            </button>
          </div>
        }
      />

      <ErrorAlert message={error} onDismiss={() => setError('')} />
      <SuccessAlert message={success} onDismiss={() => setSuccess('')} />

      {/* Filtres */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input className="field pl-9 w-full"
            placeholder="Rechercher..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} />
        </div>
        <select className="field w-full" value={filters.statut}
          onChange={(e) => setFilters({ ...filters, statut: e.target.value, page: 1 })}>
          <option value="">Tout les status</option>
          <option value="en_attente">En attente</option>
          <option value="valide">Validés</option>
          <option value="rejete">Rejetés</option>
        </select>
        <select className="field w-full" value={filters.createur_id}
          onChange={(e) => setFilters({ ...filters, createur_id: e.target.value, page: 1 })}>
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
      {(canCreate || (canModify && editing)) && (
        <form onSubmit={(e) => { e.preventDefault(); setSubmitConfirm(true) }}
          className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-slate-700">
            {editing ? 'Modifier le bureau de change' : 'Ajouter un bureau de change'}
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                N° Ordre <span className="text-slate-700">*</span>
              </label>
              <input className="field mt-1" placeholder="Ex: BC001"
                value={form.numero_ordre}
                onChange={(e) => setForm({ ...form, numero_ordre: e.target.value })}
                required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Désignation <span className="text-slate-700">*</span>
              </label>
              <input className="field mt-1" placeholder="Nom du bureau"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                N° Agrément <span className="text-slate-700">*</span>
              </label>
              <input className="field mt-1" placeholder="Ex: AGR-2024-001"
                value={form.numero_agrement}
                onChange={(e) => setForm({ ...form, numero_agrement: e.target.value })}
                required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                 Date d'expiration de l'agrément (facultatif)
              </label>
              <input
                type="date"
                className="field mt-1"
                value={form.date_expiration_agrement || ''}
                onChange={(e) => setForm({ ...form, date_expiration_agrement: e.target.value })}
              />
              <p className="mt-1 text-xs text-slate-400">
                Un rappel sera envoyé 30 jours avant l'expiration.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Représentant légal <span className="text-slate-700">*</span>
              </label>
              <input className="field mt-1" placeholder="Nom du représentant"
                value={form.representant_legal}
                onChange={(e) => setForm({ ...form, representant_legal: e.target.value })}
                required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Contact
              </label>
              <input className="field mt-1" placeholder="Votre numéro de telephone"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Adresse
              </label>
              <input className="field mt-1" placeholder="votre adresse"
                value={form.adresse}
                onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
            </div>
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
      )}

      <DataTable
        columns={columns}
        rows={rows}
        meta={meta}
        loading={loading}
        onPage={(page) => setFilters({ ...filters, page })}
      />

      {/* Modals */}
      <ConfirmModal
        open={submitConfirm}
        title={editing ? 'Confirmer la modification ?' : 'Confirmer la création ?'}
        message={editing ? 'Les modifications seront enregistrées définitivement.' : 'Êtes-vous sûr de vouloir créer cet élément ?'}
        confirmText={editing ? 'Enregistrer' : 'Confirmer'}
        onConfirm={async () => { setSubmitConfirm(false); await submit() }}
        onCancel={() => setSubmitConfirm(false)}
      />

      <ConfirmModal
        open={validateConfirm.open}
        title="Confirmer l'approbation ?"
        message="Êtes-vous sûr de vouloir approuver ce bureau de change ?"
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
        title="Refuser ce bureau de change"
        message="Êtes-vous sûr de vouloir refuser ce bureau de change ? Vous pouvez indiquer la raison du refus ci-dessous :"
        onConfirm={async (reason) => {
          const id = rejectConfirm.id
          setRejectConfirm({ open: false, id: null })
          await rejeter(id, reason)
        }}
        onCancel={() => setRejectConfirm({ open: false, id: null })}
      />

      <ViewReasonModal
        open={viewReasonModal.open}
        title="Motif du refus du bureau de change"
        reason={viewReasonModal.reason}
        onClose={() => setViewReasonModal({ open: false, reason: '' })}
      />

      <ModificationReviewModal
        open={reviewModal.open}
        item={reviewModal.item}
        fieldLabels={BUREAU_FIELD_LABELS}
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

      {/* Modal Import Excel */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800">
              Importer des bureaux de change
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Le fichier Excel doit contenir les colonnes dans cet ordre :
            </p>

            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {['numero_ordre', 'designation', 'numero_agrement', 'date_expiration_agrement', 'representant_legal', 'contact', 'adresse'].map(h => (
                      <th key={h} className="px-2 py-1.5 text-left font-semibold text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-100">
                    <td className="px-2 py-1.5 text-slate-500">BC001</td>
                    <td className="px-2 py-1.5 text-slate-500">Bureau A</td>
                    <td className="px-2 py-1.5 text-slate-500">AGR-001</td>
                    <td className="px-2 py-1.5 text-slate-500">2025-12-31</td>
                    <td className="px-2 py-1.5 text-slate-500">Jean Dupont</td>
                    <td className="px-2 py-1.5 text-slate-500">620...</td>
                    <td className="px-2 py-1.5 text-slate-500">Conakry</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {importResult && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-semibold text-emerald-700">
                  {importResult.imported} bureau(x) importé(s)
                  {importResult.skipped > 0 && ` — ${importResult.skipped} ignoré(s)`}
                </p>
                {importResult.errors?.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {importResult.errors.map((err, i) => (
                      <li key={i} className="text-xs text-amber-700">{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {!importResult && (
              <form onSubmit={handleImport} className="mt-4">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="field"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  required
                />
                <div className="mt-4 flex justify-end gap-3">
                  <button type="button"
                    onClick={() => setImportModal(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    Annuler
                  </button>
                  <button type="submit" disabled={importing || !importFile}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
                    {importing
                      ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      : <Upload size={16} />
                    }
                    {importing ? 'Importation...' : 'Importer'}
                  </button>
                </div>
              </form>
            )}

            {importResult && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => { setImportModal(false); setImportResult(null) }}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}