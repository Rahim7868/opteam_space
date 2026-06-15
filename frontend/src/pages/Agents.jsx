import { Plus, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getApiError } from '../api/client'
import DataTable from '../components/DataTable'
import ErrorAlert from '../components/ErrorAlert'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'

const emptyForm = { name: '', email: '', password: 'password', status: 'active' }

export default function Agents() {
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 })
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  function load() {
    api.get('/agents', { params: filters }).then(({ data }) => {
      setRows(data.data)
      setMeta(data.meta)
    })
  }

  useEffect(load, [filters])


  async function submit(event) {
    event.preventDefault()
    setError('')
    const payload = { ...form }
    if (editing && !payload.password) delete payload.password

    try {
      if (editing) await api.put(`/agents/${editing}`, payload)
      else await api.post('/agents', payload)
      setForm(emptyForm)
      setEditing(null)
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function deactivate(id) {
    await api.delete(`/agents/${id}`)
    load()
  }

  return (
    <>
      <PageHeader title="Agents" subtitle="Creation, modification et activation des comptes agents." />
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_170px_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input className="field pl-9" placeholder="Rechercher..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} />
        </div>
        <select className="field" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
          <option value="">Tous statuts</option>
          <option value="active">Actifs</option>
          <option value="inactive">Inactifs</option>
        </select>

      </div>

      <form className="panel mb-5 grid gap-3 p-4 lg:grid-cols-[1fr_1fr_160px_140px_auto]" onSubmit={submit}>
        <ErrorAlert message={error} />
        <input className="field" placeholder="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="field" placeholder="Mot de passe" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

        <select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="active">Actif</option>
          <option value="inactive">Inactif</option>
        </select>
        <button className="btn btn-primary">
          <Plus size={16} />
          {editing ? 'Modifier' : 'Ajouter'}
        </button>
      </form>

      <DataTable
        rows={rows}
        meta={meta}
        onPage={(page) => setFilters({ ...filters, page })}
        columns={[
          { key: 'name', label: 'Nom' },
          { key: 'email', label: 'Email' },

          { key: 'status', label: 'Statut', render: (row) => <StatusBadge status={row.status} /> },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <div className="flex gap-2">
                <button className="btn btn-secondary" onClick={() => (setEditing(row.id), setForm({ ...row, password: '' }))}>
                  Modifier
                </button>
                <button className="btn btn-danger" onClick={() => deactivate(row.id)}>
                  Desactiver
                </button>
              </div>
            ),
          },
        ]}
      />
    </>
  )
}
