import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../api/client'
import DataTable from './DataTable'
import PageHeader from './PageHeader'

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

  return match?.[1] || 'Système'
}

export default function AuditLogTable({
  category,
  title,
  subtitle,
  actionPlaceholder = 'Filtrer par action',
  entityPlaceholder = 'Filtrer par entité',
}) {
  const [rows, setRows]       = useState([])
  const [meta, setMeta]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: '', entity_type: '', page: 1,
  })

  useEffect(() => {
    setLoading(true)
    const params = Object.fromEntries(
      Object.entries({ ...filters, category }).filter(([, v]) => v !== '')
    )
    api.get('/audit-logs', { params })
      .then(({ data }) => { setRows(data.data); setMeta(data.meta) })
      .finally(() => setLoading(false))
  }, [category, filters])

  const columns = [
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
      key: 'entity_type', label: 'Entité',
      render: (row) => (
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600">
          {row.entity_type}
        </span>
      ),
    },
    { key: 'description', label: 'Description' },
  ]

  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            className="field pl-9"
            placeholder={actionPlaceholder}
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            className="field pl-9"
            placeholder={entityPlaceholder}
            value={filters.entity_type}
            onChange={(e) => setFilters({ ...filters, entity_type: e.target.value, page: 1 })}
          />
        </div>
      </div>

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
