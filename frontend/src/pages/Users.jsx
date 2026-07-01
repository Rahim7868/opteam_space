import { Edit, Plus, Search, ToggleLeft, ToggleRight, Shield } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getApiError } from '../api/client'
import DataTable from '../components/DataTable'
import ErrorAlert from '../components/ErrorAlert'
import SuccessAlert from '../components/SuccessAlert'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'

const emptyForm = {
  nom: '', email: '', adresse: '',
  service_id: '', role_id: '',
}

export default function Users() {
  const [rows, setRows]         = useState([])
  const [meta, setMeta]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [roles, setRoles]       = useState([])
  const [services, setServices] = useState([])

  const [filters, setFilters] = useState({ search: '', role_id: '', is_active: '', page: 1 })
  const [form, setForm]       = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  // Modal permissions
  const [permModal, setPermModal]           = useState({ open: false, user: null })
  const [allPermissions, setAllPermissions] = useState([])
  const [selectedPerms, setSelectedPerms]   = useState([])
  const [rolePerms, setRolePerms]           = useState([]) // permissions du rôle
  const [loadingPerms, setLoadingPerms]     = useState(false)

  useEffect(() => {
    api.get('/roles').then(({ data }) => setRoles(data.data ?? data))
    api.get('/services').then(({ data }) => setServices(data.data ?? data))
    api.get('/permissions').then(({ data }) => setAllPermissions(data.data ?? data))
  }, [])

  function load() {
    setLoading(true)
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '')
    )
    api.get('/users', { params })
      .then(({ data }) => { setRows(data.data); setMeta(data.meta) })
      .finally(() => setLoading(false))
  }

  useEffect(load, [filters])

  async function submit(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    try {
      if (editing) {
        await api.put(`/users/${editing}`, form)
        setSuccess('Acteur mis à jour.')
      } else {
        await api.post('/users', form)
        setSuccess('Acteur créé. Mot de passe initial : 00000000')
      }
      setForm(emptyForm); setEditing(null); load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function toggleStatus(user) {
    try {
      await api.patch(`/users/${user.id}/toggle-status`)
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  function startEdit(user) {
    setEditing(user.id)
    setForm({
      nom:        user.nom,
      email:      user.email,
      adresse:    user.adresse ?? '',
      service_id: user.service?.id ?? '',
      role_id:    user.role?.id ?? '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function openPermModal(user) {
    setPermModal({ open: true, user })
    setLoadingPerms(true)
    setSelectedPerms([])
    setRolePerms([])

    api.get(`/users/${user.id}`)
      .then(({ data }) => {
        const u = data.data ?? data

        // ✅ Permissions du rôle → pour affichage info
        const permsRole = u.role?.permissions?.map(p => p.libelle) ?? []
        setRolePerms(permsRole)

        // ✅ Pré-cocher toutes_permissions (rôle + directes)
        const toutesPerms = Array.isArray(u.toutes_permissions)
          ? u.toutes_permissions
          : Object.values(u.toutes_permissions ?? {})
        setSelectedPerms(toutesPerms)
      })
      .finally(() => setLoadingPerms(false))
  }

  async function savePermissions() {
    // On sauvegarde uniquement les permissions directes
    // = permissions cochées qui ne viennent PAS du rôle
    const directesLibelles = selectedPerms.filter(p => !rolePerms.includes(p))

    const ids = allPermissions
      .filter((p) => directesLibelles.includes(p.libelle))
      .map((p) => p.id)

    try {
      await api.post(`/users/${permModal.user.id}/permissions`, { permission_ids: ids })
      setSuccess('Permissions mises à jour.')
      setPermModal({ open: false, user: null })
    } catch (err) {
      setError(getApiError(err))
    }
  }

  function togglePerm(libelle) {
    // ✅ Les permissions du rôle ne peuvent pas être décochées
    if (rolePerms.includes(libelle)) return

    setSelectedPerms((prev) =>
      prev.includes(libelle)
        ? prev.filter((p) => p !== libelle)
        : [...prev, libelle]
    )
  }

  const columns = [
    { key: 'nom',   label: 'Nom' },
    { key: 'email', label: 'Email' },
    {
      key: 'role', label: 'Rôle',
      render: (row) => row.role?.libelle
        ? <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">{row.role.libelle}</span>
        : <span className="text-slate-400">—</span>,
    },
    {
      key: 'service', label: 'Service',
      render: (row) => row.service?.libelle ?? <span className="text-slate-400">—</span>,
    },
    {
      key: 'is_active', label: 'Statut',
      render: (row) => <StatusBadge status={row.is_active ? 'actif' : 'inactif'} />,
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
            onClick={() => openPermModal(row)}
            className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-200 hover:bg-teal-100"
          >
            <Shield size={13} /> Permissions
          </button>
          <button
            onClick={() => toggleStatus(row)}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ring-1 transition ${
              row.is_active
                ? 'bg-rose-50 text-rose-700 ring-rose-200 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {row.is_active
              ? <><ToggleRight size={13} /> Désactiver</>
              : <><ToggleLeft size={13} /> Activer</>
            }
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Acteurs"
        subtitle="Création et gestion des comptes utilisateurs."
      />

      <ErrorAlert message={error} onDismiss={() => setError('')} />
      <SuccessAlert message={success} onDismiss={() => setSuccess('')} />

      {/* Filtres */}
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            className="field pl-9"
            placeholder="Rechercher par nom ou email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>
        <select
          className="field"
          value={filters.role_id}
          onChange={(e) => setFilters({ ...filters, role_id: e.target.value, page: 1 })}
        >
          <option value="">Tous les rôles</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.libelle}</option>)}
        </select>
        <select
          className="field"
          value={filters.is_active}
          onChange={(e) => setFilters({ ...filters, is_active: e.target.value, page: 1 })}
        >
          <option value="">Tous statuts</option>
          <option value="1">Actifs</option>
          <option value="0">Inactifs</option>
        </select>
      </div>

      {/* Formulaire */}
      <form
        onSubmit={submit}
        className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h3 className="mb-3 text-sm font-bold text-slate-700">
          {editing ? 'Modifier un acteur' : 'Ajouter un acteur'}
        </h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <input className="field" placeholder="Nom complet"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          <input className="field" type="email" placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="field" placeholder="Adresse (optionnel)"
            value={form.adresse}
            onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
          <select className="field" value={form.role_id}
            onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
            <option value="">Sélectionner un rôle</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.libelle}</option>)}
          </select>
          <select className="field" value={form.service_id}
            onChange={(e) => setForm({ ...form, service_id: e.target.value })}>
            <option value="">Sélectionner un service</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.libelle}</option>)}
          </select>
        </div>

        {!editing && (
          <p className="mt-2 text-xs text-slate-400">
            Le mot de passe initial sera{' '}
            <span className="font-mono font-semibold">00000000</span>.
            L'acteur devra le changer à sa première connexion.
          </p>
        )}

        <div className="mt-3 flex gap-2">
          <button className="btn btn-primary">
            <Plus size={16} />
            {editing ? 'Enregistrer les modifications' : "Créer l'acteur"}
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

      <DataTable
        columns={columns}
        rows={rows}
        meta={meta}
        loading={loading}
        onPage={(page) => setFilters({ ...filters, page })}
      />

      {/* Modal permissions */}
      {permModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800">
              Permissions de{' '}
              <span className="text-teal-700">{permModal.user?.nom}</span>
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Les permissions grisées viennent du rôle et ne peuvent pas être retirées ici.
            </p>

            {loadingPerms ? (
              <div className="mt-4 flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />
              </div>
            ) : (
              <div className="mt-4 max-h-72 overflow-y-auto space-y-1">
                {allPermissions.map((perm) => {
                  const isFromRole   = rolePerms.includes(perm.libelle)
                  const isChecked    = selectedPerms.includes(perm.libelle)

                  return (
                    <label
                      key={perm.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 ${
                        isFromRole
                          ? 'cursor-not-allowed opacity-60 bg-slate-50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePerm(perm.libelle)}
                        disabled={isFromRole}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {perm.libelle}
                      </span>
                      {/* ✅ Badge indiquant que c'est une permission du rôle */}
                      {isFromRole && (
                        <span className="ml-auto rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-600 ring-1 ring-teal-200">
                          Rôle
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setPermModal({ open: false, user: null })}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={savePermissions}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
