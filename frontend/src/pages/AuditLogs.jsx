import { useEffect, useState } from 'react'
import api from '../api/client'
import DataTable from '../components/DataTable'
import PageHeader from '../components/PageHeader'

export default function AuditLogs() {
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [filters, setFilters] = useState({ action: '', entity_type: '', page: 1 })

  useEffect(() => {
    api.get('/audit-logs', { params: filters }).then(({ data }) => {
      setRows(data.data)
      setMeta(data.meta)
    })
  }, [filters])

  return (
    <>
      <PageHeader title="Historique" subtitle="Journal des actions importantes de la plateforme." />
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <input className="field" placeholder="Action" value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })} />
        <input className="field" placeholder="Entite" value={filters.entity_type} onChange={(e) => setFilters({ ...filters, entity_type: e.target.value, page: 1 })} />
      </div>
      <DataTable
        rows={rows}
        meta={meta}
        onPage={(page) => setFilters({ ...filters, page })}
        columns={[
          { key: 'created_at', label: 'Date', render: (row) => new Date(row.created_at).toLocaleString() },
          { key: 'user', label: 'Utilisateur', render: (row) => row.user?.name || '-' },
          { key: 'action', label: 'Action' },
          { key: 'entity_type', label: 'Entite' },
          { key: 'description', label: 'Description' },
        ]}
      />
    </>
  )
}
