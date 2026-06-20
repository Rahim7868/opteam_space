import { Check, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getApiError } from '../api/client'
import DataTable from '../components/DataTable'
import ErrorAlert from '../components/ErrorAlert'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'

const emptyForm = {
  date_fixing: new Date().toISOString().slice(0, 10),
  devise: 'EUR',
  cours: '',
  piece_jointe: null
}

const currencies = ['EUR', 'USD', 'GBP', 'CAD', 'CHF', 'XOF']

function formatVariation(value) {
  if (value === null || value === undefined) return '-'
  const number = Number(value)
  const sign = number > 0 ? '+' : ''
  return `${sign}${Number.isInteger(number) ? number : number.toFixed(4)}`
}

export default function Fixings() {
  const { isAdmin, isAgent } = useAuth()

  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)

  const [filters, setFilters] = useState({
    status: '',
    devise: '',
    user_id: '',
    date: '',
    page: 1
  })

  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  function load() {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '')
    )

    api.get('/fixings', { params }).then(({ data }) => {
      setRows(data.data)
      setMeta(data.meta)
    })
  }

  useEffect(load, [filters])

  async function submit(e) {
    e.preventDefault()
    setError('')

    const payload = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (v) payload.append(k, v)
    })

    try {
      await api.post('/fixings', payload)
      setForm(emptyForm)
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function decide(id, action) {
    try {
      const url =
        action === 'approve'
          ? `/fixings/${id}/approve`
          : `/fixings/${id}/reject`

      const body =
        action === 'reject'
          ? { rejection_reason: window.prompt('Motif du refus') }
          : {}

      if (action === 'reject' && !body.rejection_reason) return

      await api.post(url, body)
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  const columns = [
    { key: 'date_fixing', label: 'Date' },
    { key: 'devise', label: 'Devise' },
    {
      key: 'cours',
      label: 'Cours',
      render: (row) => Number(row.cours).toFixed(4)
    },
    {
      key: 'variation',
      label: 'Variation',
      render: (row) => (
        <span
          className={
            Number(row.variation) > 0
              ? 'text-emerald-700 font-semibold'
              : Number(row.variation) < 0
              ? 'text-rose-700 font-semibold'
              : 'text-slate-500'
          }
        >
          {formatVariation(row.variation)}
        </span>
      )
    },
    {
      key: 'piece_jointe',
      label: 'Fichier',
      render: (row) =>
        row.piece_jointe_url ? (
          <a
            href={row.piece_jointe_url}
            target="_blank"
            rel="noreferrer"
            className="text-teal-600 hover:underline"
          >
            Voir fichier
          </a>
        ) : '-'
    },
    !isAgent && {
      key: 'agent',
      label: 'Agent',
      render: (row) => row.user?.name || '-'
    },
    {
      key: 'status',
      label: 'Statut',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {isAdmin && row.status === 'pending' && (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => decide(row.id, 'approve')}
              >
                <Check size={16} />
              </button>

              <button
                className="btn btn-danger"
                onClick={() => decide(row.id, 'reject')}
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      )
    }
  ].filter(Boolean)

  return (
    <>
      <PageHeader
        title={isAdmin ? 'Fixings' : 'Mes fixings'}
        subtitle="Création et suivi des fixings"
      />

      {}
      {isAgent && (
        <form
          onSubmit={submit}
          className="panel mb-5 grid gap-3 p-4 md:grid-cols-4"
        >
          <ErrorAlert message={error} />

          <input
            type="date"
            className="field"
            value={form.date_fixing}
            onChange={(e) =>
              setForm({ ...form, date_fixing: e.target.value })
            }
          />

          <select
            className="field"
            value={form.devise}
            onChange={(e) =>
              setForm({ ...form, devise: e.target.value })
            }
          >
            {currencies.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <input
            className="field"
            placeholder="Cours"
            value={form.cours}
            onChange={(e) =>
              setForm({ ...form, cours: e.target.value })
            }
          />

          <input
            type="file"
            className="field"
            onChange={(e) =>
              setForm({ ...form, piece_jointe: e.target.files[0] })
            }
          />

          <button className="btn btn-primary col-span-full">
            <Plus size={16} />
            Ajouter fixing
          </button>
        </form>
      )}

      <DataTable
        rows={rows}
        meta={meta}
        onPage={(page) => setFilters({ ...filters, page })}
        columns={columns}
      />
    </>
  )
}