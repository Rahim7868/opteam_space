import { useEffect, useState } from 'react'
import { FileDown, FileSpreadsheet, ListChecks, RefreshCw, Trash2 } from 'lucide-react'
import api, { getApiError } from '../api/client'
import ConfirmModal from './ConfirmModal'
import DataTable from './DataTable'
import ErrorAlert from './ErrorAlert'
import IconActionButton from './IconActionButton'
import PageHeader from './PageHeader'
import SuccessAlert from './SuccessAlert'
import { useAuth } from '../context/AuthContext'

const DELETE_PERMISSION_BY_CATEGORY = {
  'user-actions': 'supprimer_audit_actions_utilisateurs',
  exchange: 'supprimer_audit_fixings_bureaux',
  locations: 'supprimer_audit_locaux',
  'access-control': 'supprimer_audit_utilisateurs_roles_permissions',
}

const EXPORT_PERMISSION_BY_CATEGORY = {
  'user-actions': {
    pdf: 'exporter_audit_actions_utilisateurs_pdf',
    excel: 'exporter_audit_actions_utilisateurs_excel',
  },
  exchange: {
    pdf: 'exporter_audit_fixings_bureaux_pdf',
    excel: 'exporter_audit_fixings_bureaux_excel',
  },
  locations: {
    pdf: 'exporter_audit_locaux_pdf',
    excel: 'exporter_audit_locaux_excel',
  },
  'access-control': {
    pdf: 'exporter_audit_utilisateurs_roles_permissions_pdf',
    excel: 'exporter_audit_utilisateurs_roles_permissions_excel',
  },
}

const ACTION_COLORS = {
  login:               'bg-blue-50 text-blue-700 ring-blue-200',
  logout:              'bg-slate-100 text-slate-600 ring-slate-200',
  password_changed:    'bg-indigo-50 text-indigo-700 ring-indigo-200',
  user_created:        'bg-emerald-50 text-emerald-700 ring-emerald-200',
  user_updated:        'bg-amber-50 text-amber-700 ring-amber-200',
  user_activated:      'bg-emerald-50 text-emerald-700 ring-emerald-200',
  user_deactivated:    'bg-rose-50 text-rose-700 ring-rose-200',
  permissions_updated: 'bg-teal-50 text-teal-700 ring-teal-200',
  fixing_created:      'bg-emerald-50 text-emerald-700 ring-emerald-200',
  fixing_updated:      'bg-amber-50 text-amber-700 ring-amber-200',
  fixing_valide:       'bg-emerald-50 text-emerald-700 ring-emerald-200',
  fixing_rejete:       'bg-rose-50 text-rose-700 ring-rose-200',
  bureau_created:      'bg-emerald-50 text-emerald-700 ring-emerald-200',
  bureau_updated:      'bg-amber-50 text-amber-700 ring-amber-200',
  bureau_valide:       'bg-emerald-50 text-emerald-700 ring-emerald-200',
  bureau_rejete:       'bg-rose-50 text-rose-700 ring-rose-200',
  agence_created:      'bg-emerald-50 text-emerald-700 ring-emerald-200',
  agence_updated:      'bg-amber-50 text-amber-700 ring-amber-200',
  agence_deleted:      'bg-rose-50 text-rose-700 ring-rose-200',
  direction_created:   'bg-emerald-50 text-emerald-700 ring-emerald-200',
  direction_updated:   'bg-amber-50 text-amber-700 ring-amber-200',
  direction_deleted:   'bg-rose-50 text-rose-700 ring-rose-200',
  departement_created: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  departement_updated: 'bg-amber-50 text-amber-700 ring-amber-200',
  departement_deleted: 'bg-rose-50 text-rose-700 ring-rose-200',
  service_created:     'bg-emerald-50 text-emerald-700 ring-emerald-200',
  service_updated:     'bg-amber-50 text-amber-700 ring-amber-200',
  service_deleted:     'bg-rose-50 text-rose-700 ring-rose-200',
  role_created:        'bg-emerald-50 text-emerald-700 ring-emerald-200',
  role_updated:        'bg-amber-50 text-amber-700 ring-amber-200',
  role_deleted:        'bg-rose-50 text-rose-700 ring-rose-200',
  permission_created:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  permission_updated:  'bg-amber-50 text-amber-700 ring-amber-200',
  permission_deleted:  'bg-rose-50 text-rose-700 ring-rose-200',
}

function ActionBadge({ action }) {
  const style = ACTION_COLORS[action] ?? 'bg-slate-100 text-slate-600 ring-slate-200'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${style}`}>
      {action}
    </span>
  )
}

function userLabel(row) {
  if (row.user?.nom) return row.user.nom

  const description = row.description || ''
  const match = description.match(/(?:Connexion|Déconnexion|Deconnexion) de (.+)$/i)

  return match?.[1] || 'Systeme'
}

export default function AuditLogTable({
  category,
  title,
  subtitle,
}) {
  const { hasPermission } = useAuth()
  const canDelete = hasPermission(DELETE_PERMISSION_BY_CATEGORY[category])
  const canExportPdf = hasPermission(EXPORT_PERMISSION_BY_CATEGORY[category].pdf)
  const canExportExcel = hasPermission(EXPORT_PERMISSION_BY_CATEGORY[category].excel)
  const [rows, setRows]       = useState([])
  const [meta, setMeta]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [users, setUsers]     = useState([])
  const defaultFilters = { date_debut: '', date_fin: '', user_id: '', page: 1 }
  const [filters, setFilters] = useState(defaultFilters)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, ids: [], bulk: false })
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(null)
  const [reloadVersion, setReloadVersion] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Charger les utilisateurs actifs
  useEffect(() => {
    api.get('/users', { params: { per_page: 1000 } })
      .then(({ data }) => setUsers(data.data ?? []))
      .catch(() => {})
  }, [])

  function resetFilters() {
    setSelectedIds([])
    setFilters(defaultFilters)
  }

  function updateFilters(nextFilters) {
    setSelectedIds([])
    setFilters(nextFilters)
  }

  useEffect(() => {
    setLoading(true)
    const params = Object.fromEntries(
      Object.entries({ ...filters, category }).filter(([, v]) => v !== '')
    )
    api.get('/audit-logs', { params })
      .then(({ data }) => { setRows(data.data); setMeta(data.meta) })
      .finally(() => setLoading(false))
  }, [category, filters, reloadVersion])

  function toggleSelectedRows(ids) {
    setSelectedIds((current) => {
      const allSelected = ids.length > 0 && ids.every((id) => current.includes(id))
      if (allSelected) return current.filter((id) => !ids.includes(id))
      return [...new Set([...current, ...ids])]
    })
  }

  function toggleSelectionMode() {
    if (selectionMode) {
      setSelectionMode(false)
      setSelectedIds([])
      return
    }

    setSelectionMode(true)
  }

  async function deleteLogs() {
    const activeFilters = Object.fromEntries(
      Object.entries({
        category,
        date_debut: filters.date_debut,
        date_fin: filters.date_fin,
        user_id: filters.user_id,
      }).filter(([, value]) => value !== '')
    )

    setDeleting(true)
    setError('')
    setSuccess('')

    try {
      const response = deleteConfirm.bulk
        ? await api.delete('/audit-logs/bulk', {
          params: activeFilters,
          data: { ids: deleteConfirm.ids },
        })
        : await api.delete(`/audit-logs/${deleteConfirm.ids[0]}`, { params: activeFilters })

      setSuccess(response.data?.message || 'Entrée(s) d’audit supprimée(s).')
      setDeleteConfirm({ open: false, ids: [], bulk: false })
      setSelectedIds([])
      setSelectionMode(false)
      setReloadVersion((version) => version + 1)
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setDeleting(false)
    }
  }

  async function exportLogs(format) {
    const params = Object.fromEntries(
      Object.entries({
        category,
        date_debut: filters.date_debut,
        date_fin: filters.date_fin,
        user_id: filters.user_id,
      }).filter(([, value]) => value !== '')
    )

    setExporting(format)
    setError('')
    setSuccess('')

    try {
      const { data } = await api.get(`/export/audit-logs/${format}`, {
        params,
        responseType: 'blob',
      })
      const extension = format === 'pdf' ? 'pdf' : 'xlsx'
      const url = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `audit-${category}-${new Date().toISOString().slice(0, 10)}.${extension}`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setSuccess(`Export ${format.toUpperCase()} téléchargé.`)
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setExporting(null)
    }
  }

  const columns = [
    ...(selectionMode ? [{
      key: 'selection',
      label: (
        <input
          type="checkbox"
          aria-label="Sélectionner toutes les entrées de cette page"
          className="h-4 w-4 accent-teal-700"
          checked={rows.length > 0 && rows.every((row) => selectedIds.includes(row.id))}
          onChange={() => toggleSelectedRows(rows.map((row) => row.id))}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          aria-label={`Sélectionner l’entrée ${row.action}`}
          className="h-4 w-4 accent-teal-700"
          checked={selectedIds.includes(row.id)}
          onChange={() => toggleSelectedRows([row.id])}
        />
      ),
    }] : []),
    {
      key: 'created_at', label: 'Date',
      render: (row) => (
        <span className="text-slate-500 text-xs">
          {new Date(row.created_at).toLocaleString('fr-FR', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'user', label: 'Utilisateur',
      render: (row) => <div className="text-sm font-semibold text-slate-800">{userLabel(row)}</div>,
    },
    {
      key: 'action', label: 'Action',
      render: (row) => <ActionBadge action={row.action} />,
    },
    {
      key: 'entity_type', label: 'Entite',
      render: (row) => (
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">
          {row.entity_type}
        </span>
      ),
    },
    { key: 'description', label: 'Description' },
    ...(canDelete ? [{
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <IconActionButton
          icon={Trash2}
          label="Supprimer cette entrée d’audit"
          tone="danger"
          onClick={() => setDeleteConfirm({ open: true, ids: [row.id], bulk: false })}
        />
      ),
    }] : []),
  ]

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={(canExportPdf || canExportExcel) && (
          <div className="flex flex-wrap gap-2">
            {canExportPdf && (
              <button
                type="button"
                onClick={() => exportLogs('pdf')}
                disabled={exporting !== null}
                className="inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-600 hover:shadow-md disabled:cursor-wait disabled:opacity-60"
              >
                <FileDown size={16} />
                {exporting === 'pdf' ? 'Export PDF...' : 'PDF'}
              </button>
            )}
            {canExportExcel && (
              <button
                type="button"
                onClick={() => exportLogs('excel')}
                disabled={exporting !== null}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md disabled:cursor-wait disabled:opacity-60"
              >
                <FileSpreadsheet size={16} />
                {exporting === 'excel' ? 'Export Excel...' : 'Excel'}
              </button>
            )}
          </div>
        )}
      />

      <ErrorAlert message={error} onDismiss={() => setError('')} />
      <SuccessAlert message={success} onDismiss={() => setSuccess('')} />

      {/* Filtres */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Date début
          </label>
          <input
            type="date"
            className="field w-full"
            value={filters.date_debut || ''}
            onChange={(e) => updateFilters({ ...filters, date_debut: e.target.value, page: 1 })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Date fin
          </label>
          <input
            type="date"
            className="field w-full"
            value={filters.date_fin || ''}
            onChange={(e) => updateFilters({ ...filters, date_fin: e.target.value, page: 1 })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Utilisateur
          </label>
          <select
            className="field w-full"
            value={filters.user_id || ''}
            onChange={(e) => updateFilters({ ...filters, user_id: e.target.value, page: 1 })}
          >
            <option value="">Tous les utilisateurs</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.nom}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={resetFilters}
            className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            <RefreshCw size={14} /> Réinitialiser
          </button>
        </div>
      </div>

      {canDelete && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <button
            type="button"
            aria-pressed={selectionMode}
            onClick={toggleSelectionMode}
            className="btn btn-secondary"
          >
            <ListChecks size={16} />
            {selectionMode ? 'Annuler la sélection' : 'Sélectionner'}
          </button>
          {selectionMode && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-600">
                {selectedIds.length} {selectedIds.length === 1 ? 'entrée sélectionnée' : 'entrées sélectionnées'}
              </span>
              <IconActionButton
                icon={Trash2}
                label={`Supprimer ${selectedIds.length} entrée(s) sélectionnée(s)`}
                tone="danger"
                disabled={selectedIds.length === 0 || deleting}
                onClick={() => setDeleteConfirm({ open: true, ids: selectedIds, bulk: true })}
              />
            </div>
          )}
        </div>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        meta={meta}
        loading={loading}
        onPage={(page) => setFilters({ ...filters, page })}
      />

      <ConfirmModal
        open={deleteConfirm.open}
        title={deleteConfirm.bulk ? 'Confirmer la suppression groupée' : 'Confirmer la suppression'}
        message={deleteConfirm.bulk
          ? `Supprimer les ${deleteConfirm.ids.length} entrées sélectionnées dans cette catégorie et selon les filtres actuels ? Cette action est irréversible.`
          : 'Supprimer cette entrée d’audit ? Cette action est irréversible.'}
        confirmText={deleting ? 'Suppression...' : 'Supprimer'}
        danger
        onConfirm={deleteLogs}
        onCancel={() => setDeleteConfirm({ open: false, ids: [], bulk: false })}
      />
    </>
  )
}