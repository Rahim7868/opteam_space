import { Plus, Save, Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getApiError } from '../api/client'
import DataTable from '../components/DataTable'
import ErrorAlert from '../components/ErrorAlert'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'

const emptyForm = { numero_ordre: '', designation: '', numero_agrement: '', representant_legal: '', contact: '', addresse: '', status: 'active' }

export default function Bureaux() {
  const { isAdmin } = useAuth()
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 })
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')

  function load() {
    api.get('/bureau-changes', { params: filters }).then(({ data }) => {
      setRows(data.data)
      setMeta(data.meta)
    })
  }

  useEffect(load, [filters])

  async function submit(event) {
    event.preventDefault()
    setError('')

    try {
      if (editing) {
        await api.put(`/bureau-changes/${editing}`, form)
      } else {
        await api.post('/bureau-changes', form)
      }
      setForm(emptyForm)
      setEditing(null)
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function deactivate(id) {
    await api.delete(`/bureau-changes/${id}`)
    load()
  }

  return (
    <>
      <PageHeader title="Bureaux de change" subtitle="Consultation et administration des bureaux de change." />
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
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

      {isAdmin && (
        <form className="panel mb-5 grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-4" onSubmit={submit}>
          <ErrorAlert message={error} />
          <input className="field" placeholder="Numero Ordre" value={form.numero_ordre} onChange={(e) => setForm({ ...form, numero_ordre: e.target.value })} disabled={!!editing} />
          <input className="field" placeholder="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
          <input className="field" placeholder="Agrement" value={form.numero_agrement} onChange={(e) => setForm({ ...form, numero_agrement: e.target.value })} />
          <input className="field" placeholder="Representant" value={form.representant_legal} onChange={(e) => setForm({ ...form, representant_legal: e.target.value })} />
          <input className="field" placeholder="Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <input className="field" placeholder="Adresse" value={form.addresse} onChange={(e) => setForm({ ...form, addresse: e.target.value })} />
          <select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
          <button className="btn btn-primary md:col-span-2 lg:col-span-4">
            {editing ? <Save size={16} /> : <Plus size={16} />}
            {editing ? 'Enregistrer' : 'Ajouter'}
          </button>
        </form>
      )}

      <DataTable
        rows={rows}
        meta={meta}
        onPage={(page) => setFilters({ ...filters, page })}
        columns={[
          { key: 'numero_ordre', label: 'N. Ordre' },
          { key: 'designation', label: 'Designation' },
          { key: 'numero_agrement', label: 'Agrement' },
          { key: 'representant_legal', label: 'Representant' },
          { key: 'contact', label: 'Contact' },
          { key: 'addresse', label: 'Adresse' },
          { key: 'status', label: 'Statut', render: (row) => <StatusBadge status={row.status} /> },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) =>
              isAdmin && (
                <div className="flex gap-2">
                  <button className="btn btn-secondary" onClick={() => (setEditing(row.numero_ordre), setForm(row))}>
                    Modifier
                  </button>
                  <button className="btn btn-danger" onClick={() => deactivate(row.numero_ordre)}>
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
