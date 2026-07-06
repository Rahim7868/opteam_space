import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../api/client'
import DataTable from '../components/DataTable'
import PageHeader from '../components/PageHeader'

const ACTION_COLORS = {
  login:              'bg-blue-50 text-blue-700 ring-blue-200',
  logout:             'bg-slate-100 text-slate-600 ring-slate-200',
  agent_created:      'bg-emerald-50 text-emerald-700 ring-emerald-200',
  agent_updated:      'bg-amber-50 text-amber-700 ring-amber-200',
  agent_deactivated:  'bg-rose-50 text-rose-700 ring-rose-200',
  bureau_created:     'bg-emerald-50 text-emerald-700 ring-emerald-200',
  bureau_updated:     'bg-amber-50 text-amber-700 ring-amber-200',
  bureau_deactivated: 'bg-rose-50 text-rose-700 ring-rose-200',
}

function ActionBadge({ action }) {
  const style = ACTION_COLORS[action] ?? 'bg-slate-100 text-slate-600 ring-slate-200'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${style}`}>
      {action}
    </span>
  )
}

export default function AuditLogs() {
  const [rows, setRows]       = useState([])
  const [meta, setMeta]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: '', entity_type: '', page: 1,
  })

  useEffect(() => {
    setLoading(true)
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '')
    )
    api.get('/audit-logs', { params })
      .then(({ data }) => { setRows(data.data); setMeta(data.meta) })
      .finally(() => setLoading(false))
  }, [filters])

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
      render: (row) => row.user
        ? (
          <div>
            <div className="font-semibold text-slate-800 text-sm">{row.user.nom}</div>
          </div>
        )
        : <span className="text-slate-400">N/A</span>,
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
      <PageHeader
        title="Historique"
        subtitle="Journal des actions importantes de la plateforme."
      />

      {/* Filtres */}
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            className="field pl-9"
            placeholder="Filtrer par action (ex: login, bureau_created...)"
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
          />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            className="field pl-9"
            placeholder="Filtrer par entité (ex: User, BureauChange...)"
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
