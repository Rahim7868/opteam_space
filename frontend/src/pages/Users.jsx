import { Edit, Plus, Search, ToggleLeft, ToggleRight, Shield } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import api, { getApiError } from '../api/client'
import ConfirmModal from '../components/ConfirmModal'
import DataTable from '../components/DataTable'
import ErrorAlert from '../components/ErrorAlert'
import SuccessAlert from '../components/SuccessAlert'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'

const emptyForm = {
  nom: '', email: '', adresse: '',
  fonction: '',
  agence_id: '', direction_id: '', departement_id: '', service_id: '',
  role_id: '',
}

export default function Users() {
  const [rows, setRows]         = useState([])
  const [meta, setMeta]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [roles, setRoles]       = useState([])
  const [agences, setAgences]           = useState([])
  const [directions, setDirections]     = useState([])
  const [departements, setDepartements] = useState([])
  const [services, setServices]         = useState([])

  const [filters, setFilters] = useState({ search: '', role_id: '', is_active: '', page: 1 })
  const [form, setForm]       = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const originalForm          = useRef(null)

  // Modal permissions
  const [permModal, setPermModal]           = useState({ open: false, user: null })
  const [allPermissions, setAllPermissions] = useState([])
  const [selectedPerms, setSelectedPerms]   = useState([])
  const [rolePerms, setRolePerms]           = useState([])
  const [loadingPerms, setLoadingPerms]     = useState(false)

  // Confirmation modals
  const [submitConfirm, setSubmitConfirm] = useState(false)
  const [statusConfirm, setStatusConfirm] = useState({ open: false, user: null })
  const [permsConfirm, setPermsConfirm]   = useState(false)

  useEffect(() => {
    api.get('/roles').then(({ data }) => setRoles(data.data ?? data))
    api.get('/agences', { params: { per_page: 1000 } }).then(({ data }) => setAgences(data.data ?? data))
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

  async function handleAgenceChange(agenceId) {
    setForm(prev => ({
      ...prev,
      agence_id: agenceId,
      direction_id: '',
      departement_id: '',
      service_id: '',
    }))
    setDirections([])
    setDepartements([])
    setServices([])

    if (agenceId) {
      try {
        const { data } = await api.get('/directions', { params: { agence_id: agenceId, per_page: 1000 } })
        setDirections(data.data ?? data)
      } catch (err) {
        setError(getApiError(err))
      }
    }
  }

  async function handleDirectionChange(directionId) {
    setForm(prev => ({
      ...prev,
      direction_id: directionId,
      departement_id: '',
      service_id: '',
    }))
    setDepartements([])
    setServices([])

    if (directionId) {
      try {
        const { data } = await api.get('/departements', { params: { direction_id: directionId, per_page: 1000 } })
        setDepartements(data.data ?? data)
      } catch (err) {
        setError(getApiError(err))
      }
    }
  }

  async function handleDepartementChange(departementId) {
    setForm(prev => ({
      ...prev,
      departement_id: departementId,
      service_id: '',
    }))
    setServices([])

    if (departementId) {
      try {
        const { data } = await api.get('/services', { params: { departement_id: departementId, per_page: 1000 } })
        setServices(data.data ?? data)
      } catch (err) {
        setError(getApiError(err))
      }
    }
  }

  function resetForm() {
    setForm(emptyForm)
    setDirections([])
    setDepartements([])
    setServices([])
    setEditing(null)
  }

  async function submit() {
    setError(''); setSuccess('')
    try {
      if (editing) {
        if (JSON.stringify(form) === JSON.stringify(originalForm.current)) {
          resetForm()
          return
        }
        await api.put(`/users/${editing}`, form)
        setSuccess('Acteur mis à jour.')
      } else {
        await api.post('/users', form)
        setSuccess('Acteur créé. Mot de passe initial : 00000000')
      }
      resetForm()
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function executeToggleStatus(user) {
    try {
      await api.patch(`/users/${user.id}/toggle-status`)
      setSuccess(`Statut de l'acteur mis à jour.`)
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function startEdit(user) {
    setEditing(user.id)

    const h = user.hierarchie || {}

    const formData = {
      nom:            user.nom,
      email:          user.email,
      adresse:        user.adresse ?? '',
      fonction:       user.fonction ?? '',
      agence_id:      h.agence_id ?? '',
      direction_id:   h.direction_id ?? '',
      departement_id: h.departement_id ?? '',
      service_id:     h.service_id ?? '',
      role_id:        user.role?.id ?? '',
    }

    setForm(formData)
    originalForm.current = { ...formData }

    try {
      if (h.agence_id) {
        const { data } = await api.get('/directions', { params: { agence_id: h.agence_id, per_page: 1000 } })
        setDirections(data.data ?? data)
      } else {
        setDirections([])
      }

      if (h.direction_id) {
        const { data } = await api.get('/departements', { params: { direction_id: h.direction_id, per_page: 1000 } })
        setDepartements(data.data ?? data)
      } else {
        setDepartements([])
      }

      if (h.departement_id) {
        const { data } = await api.get('/services', { params: { departement_id: h.departement_id, per_page: 1000 } })
        setServices(data.data ?? data)
      } else {
        setServices([])
      }
    } catch (err) {
      console.error(err)
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const originalPermissions   = useRef([])

  function openPermModal(user) {
    setPermModal({ open: true, user })
    setLoadingPerms(true)
    setSelectedPerms([])
    setRolePerms([])

    api.get(`/users/${user.id}`)
      .then(({ data }) => {
        const u = data.data ?? data

        const permsRole = u.role?.permissions?.map(p => p.libelle) ?? []
        setRolePerms(permsRole)

        // Pré-cocher toutes les permissions effectives de l'acteur (role + directes - retirees)
        const toutesPerms = Array.isArray(u.toutes_permissions)
          ? u.toutes_permissions
          : Object.values(u.toutes_permissions ?? {})
        setSelectedPerms(toutesPerms)
        originalPermissions.current = [...toutesPerms]
      })
      .finally(() => setLoadingPerms(false))
  }

  async function executeSavePermissions() {
    // Vérifier si les permissions ont été modifiées
    const hasChanged = selectedPerms.length !== originalPermissions.current.length ||
      selectedPerms.some(p => !originalPermissions.current.includes(p))

    const directesLibelles = selectedPerms.filter(p => !rolePerms.includes(p))
    const deniedLibelles = rolePerms.filter(p => !selectedPerms.includes(p))

    const ids = allPermissions
      .filter((p) => directesLibelles.includes(p.libelle))
      .map((p) => p.id)

    const deniedIds = allPermissions
      .filter((p) => deniedLibelles.includes(p.libelle))
      .map((p) => p.id)

    try {
      await api.post(`/users/${permModal.user.id}/permissions`, {
        permission_ids: ids,
        denied_ids: deniedIds,
      })
      if (hasChanged) {
        setSuccess('Permissions mises à jour.')
      }
      setPermModal({ open: false, user: null })
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  function togglePerm(libelle) {
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
      key: 'fonction', label: 'Fonction',
      render: (row) => row.fonction
        ? <span className="text-slate-700 text-sm">{row.fonction}</span>
        : <span className="text-slate-400">N/A</span>,
    },
    {
      key: 'role', label: 'Rôle',
      render: (row) => row.role?.libelle
        ? <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">{row.role.libelle}</span>
        : <span className="text-slate-400">N/A</span>,
    },
    {
      key: 'agence', label: 'Agence',
      render: (row) => row.agence ?? <span className="text-slate-400">N/A</span>,
    },
    {
      key: 'direction', label: 'Direction',
      render: (row) => row.direction ?? <span className="text-slate-400">N/A</span>,
    },
    {
      key: 'departement', label: 'Département',
      render: (row) => row.departement ?? <span className="text-slate-400">N/A</span>,
    },
    {
      key: 'service', label: 'Service',
      render: (row) => row.service?.libelle ?? <span className="text-slate-400">N/A</span>,
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
            onClick={() => setStatusConfirm({ open: true, user: row })}
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
        onSubmit={(e) => { e.preventDefault(); setSubmitConfirm(true) }}
        className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <h3 className="mb-3 text-sm font-bold text-slate-700">
          {editing ? 'Modifier un acteur' : 'Ajouter un acteur'}
        </h3>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <input className="field" placeholder="Nom complet *"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            required />
          <input className="field" type="email" placeholder="Email *"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required />
          <input className="field" placeholder="Adresse (optionnel)"
            value={form.adresse}
            onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
          <input className="field" placeholder="Fonction (ex: Directeur, Caissier...)"
            value={form.fonction}
            onChange={(e) => setForm({ ...form, fonction: e.target.value })} />
          <select className="field" value={form.role_id}
            onChange={(e) => setForm({ ...form, role_id: e.target.value })}
            required>
            <option value="">Sélectionner un rôle *</option>
            {roles.map((r) => <option key={r.id} value={r.id}>{r.libelle}</option>)}
          </select>
          <select className="field" value={form.agence_id}
            onChange={(e) => handleAgenceChange(e.target.value)}>
            <option value="">Sélectionner une agence</option>
            {agences.map((a) => <option key={a.id} value={a.id}>{a.libelle}</option>)}
          </select>
          <select className="field" value={form.direction_id}
            onChange={(e) => handleDirectionChange(e.target.value)}
            disabled={!form.agence_id}>
            <option value="">Sélectionner une direction</option>
            {directions.map((d) => <option key={d.id} value={d.id}>{d.libelle}</option>)}
          </select>
          <select className="field" value={form.departement_id}
            onChange={(e) => handleDepartementChange(e.target.value)}
            disabled={!form.direction_id}>
            <option value="">Sélectionner un département</option>
            {departements.map((d) => <option key={d.id} value={d.id}>{d.libelle}</option>)}
          </select>
          <select className="field" value={form.service_id}
            onChange={(e) => setForm({ ...form, service_id: e.target.value })}
            disabled={!form.departement_id}
            required>
            <option value="">Sélectionner un service *</option>
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
              onClick={resetForm}
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
              Cochez ou décochez librement les permissions de cet acteur.
            </p>

            {loadingPerms ? (
              <div className="mt-4 flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-teal-600" />
              </div>
            ) : (
              <div className="mt-4 max-h-72 overflow-y-auto space-y-1">
                {allPermissions.map((perm) => {
                  const isChecked  = selectedPerms.includes(perm.libelle)

                  return (
                    <label
                      key={perm.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePerm(perm.libelle)}
                        className="h-4 w-4 rounded border-slate-300 text-teal-600"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {perm.libelle}
                      </span>
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
                onClick={() => setPermsConfirm(true)}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation création/modification */}
      <ConfirmModal
        open={submitConfirm}
        title={editing ? 'Confirmer la modification ?' : 'Confirmer la création ?'}
        message={editing ? 'Les modifications seront enregistrées définitivement.' : 'Êtes-vous sûr de vouloir créer cet élément ?'}
        confirmText={editing ? 'Enregistrer' : 'Confirmer'}
        onConfirm={async () => { setSubmitConfirm(false); await submit() }}
        onCancel={() => setSubmitConfirm(false)}
      />

      {/* Modal confirmation changement statut */}
      <ConfirmModal
        open={statusConfirm.open}
        title={statusConfirm.user?.is_active ? 'Désactiver cet acteur ?' : 'Activer cet acteur ?'}
        message={statusConfirm.user?.is_active ? 'Êtes-vous sûr de vouloir désactiver ce compte ?' : 'Êtes-vous sûr de vouloir activer ce compte ?'}
        confirmText={statusConfirm.user?.is_active ? 'Désactiver' : 'Activer'}
        danger={statusConfirm.user?.is_active}
        onConfirm={async () => {
          const userObj = statusConfirm.user
          setStatusConfirm({ open: false, user: null })
          await executeToggleStatus(userObj)
        }}
        onCancel={() => setStatusConfirm({ open: false, user: null })}
      />

      {/* Modal confirmation permissions directes */}
      <ConfirmModal
        open={permsConfirm}
        title="Confirmer la modification ?"
        message="Les modifications des permissions seront enregistrées définitivement."
        confirmText="Enregistrer"
        onConfirm={async () => {
          setPermsConfirm(false)
          await executeSavePermissions()
        }}
        onCancel={() => setPermsConfirm(false)}
      />
    </>
  )
}