import { Edit, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import api, { getApiError } from '../api/client'
import ConfirmModal from '../components/ConfirmModal'
import DataTable from '../components/DataTable'
import ErrorAlert from '../components/ErrorAlert'
import SuccessAlert from '../components/SuccessAlert'
import PageHeader from '../components/PageHeader'

const emptyForm = { libelle: '', permission_ids: [] }

export default function Roles() {
  const [rows, setRows]                     = useState([])
  const [loading, setLoading]               = useState(true)
  const [allPermissions, setAllPermissions] = useState([])
  const [form, setForm]                     = useState(emptyForm)
  const [editing, setEditing]               = useState(null)
  const [error, setError]                   = useState('')
  const [success, setSuccess]               = useState('')
  const originalForm = useRef(null)
  const [search, setSearch]                 = useState('')
  const [confirmModal, setConfirmModal]     = useState({ open: false, id: null })

  useEffect(() => {
    api.get('/permissions').then(({ data }) =>
      setAllPermissions(data.data ?? data)
    )
  }, [])

  function load() {
    setLoading(true)
    api.get('/roles')
      .then(({ data }) => setRows(data.data ?? data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  function togglePermission(id) {
    setForm((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(id)
        ? prev.permission_ids.filter((p) => p !== id)
        : [...prev.permission_ids, id],
    }))
  }

  async function submit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      if (editing) {
        if (JSON.stringify(form) === JSON.stringify(originalForm.current)) {
          setForm(emptyForm); setEditing(null)
          return
        }
        await api.put(`/roles/${editing}`, form)
        setSuccess('Rôle mis à jour.')
      } else {
        await api.post('/roles', form)
        setSuccess('Rôle créé avec succès.')
      }
      setForm(emptyForm); setEditing(null); load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function destroy(id) {
    try {
      await api.delete(`/roles/${id}`)
      setSuccess('Rôle supprimé.')
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  function startEdit(role) {
    setEditing(role.id)
    setForm({
      libelle:        role.libelle,
      permission_ids: (role.permissions ?? []).map((p) => p.id),
    })
    originalForm.current = {
      libelle:        role.libelle,
      permission_ids: (role.permissions ?? []).map((p) => p.id),
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const filtered = rows.filter((r) =>
    r.libelle.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: 'libelle', label: 'Libellé' },
    {
      key: 'permissions', label: 'Permissions',
      render: (row) => {
        const perms = row.permissions ?? []
        if (perms.length === 0)
          return <span className="text-slate-400 text-xs">N/A</span>
        return (
          <div className="flex flex-wrap gap-1">
            {perms.slice(0, 3).map((p) => (
              <span key={p.id}
                className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700 ring-1 ring-teal-200">
                {p.libelle}
              </span>
            ))}
            {perms.length > 3 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                +{perms.length - 3}
              </span>
            )}
          </div>
        )
      },
    },
    {
      key: 'users_count', label: 'Acteurs',
      render: (row) => (
        <span className="font-semibold text-slate-700">
          {row.users_count ?? <span className="text-slate-400">N/A</span>}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => startEdit(row)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <Edit size={13} /> Modifier
          </button>
          <button
            onClick={() => setConfirmModal({ open: true, id: row.id })}
            className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
          >
            <Trash2 size={13} /> Supprimer
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Rôles"
        subtitle="Création et gestion des rôles et de leurs permissions."
      />

      <ErrorAlert message={error} onDismiss={() => setError('')} />
      <SuccessAlert message={success} onDismiss={() => setSuccess('')} />

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            className="field pl-9"
            placeholder="Rechercher un rôle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <form
        onSubmit={submit}
        className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h3 className="mb-3 text-sm font-bold text-slate-700">
          {editing ? 'Modifier le rôle' : 'Ajouter un rôle'}
        </h3>

        <input
          className="field mb-3"
          placeholder="Libellé du rôle (ex: Superviseur) *"
          value={form.libelle}
          onChange={(e) => setForm({ ...form, libelle: e.target.value })}
          required
        />

        <div className="mb-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Permissions associées
          </p>
          <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3 max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-3">
            {allPermissions.map((perm) => (
              <label
                key={perm.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={form.permission_ids.includes(perm.id)}
                  onChange={() => togglePermission(perm.id)}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600"
                />
                <span className="text-sm text-slate-700">{perm.libelle}</span>
              </label>
            ))}
            {allPermissions.length === 0 && (
              <p className="text-sm text-slate-400 col-span-3 py-2 text-center">
                Aucune permission disponible.
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button className="btn btn-primary">
            <Plus size={16} />
            {editing ? 'Enregistrer' : 'Créer le rôle'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => { setEditing(null); setForm(emptyForm) }}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Annuler
            </button>
          )}
        </div>
      </form>

      <DataTable columns={columns} rows={filtered} loading={loading} />

      <ConfirmModal
        open={confirmModal.open}
        title="Confirmer la suppression"
        message="Cette action est irréversible."
        danger={true}
        onConfirm={async () => {
          await destroy(confirmModal.id)
          setConfirmModal({ open: false, id: null })
        }}
        onCancel={() => setConfirmModal({ open: false, id: null })}
      />
    </>
  )
}