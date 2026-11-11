import { Edit, Eye, Plus, Search, Shield, ToggleLeft, ToggleRight, RefreshCw, UserX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import api, { getApiError } from '../api/client'
import ConfirmModal from '../components/ConfirmModal'
import DataTable from '../components/DataTable'
import IconActionButton from '../components/IconActionButton'
import ErrorAlert from '../components/ErrorAlert'
import SuccessAlert from '../components/SuccessAlert'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import ModificationReviewModal from '../components/ModificationReviewModal'
import { useAuth } from '../context/AuthContext'
import DetailModal, { formatDate } from '../components/DetailModal'
import DeactivateUserModal from '../components/DeactivateUserModal'
import DeactivatedUsersModal from '../components/DeactivatedUsersModal'

const USER_FIELD_LABELS = {
  nom: 'Nom',
  email: 'Email',
  adresse: 'Adresse',
  fonction: 'Fonction',
  role_id: 'Rôle',
  agence_id: 'Agence',
  direction_id: 'Direction',
  departement_id: 'Département',
  service_id: 'Service',
  is_active: 'Statut',
}

const emptyForm = {
  nom: '', email: '', adresse: '',
  fonction: '',
  agence_id: '', direction_id: '', departement_id: '', service_id: '',
  role_id: '',
}

export default function Users() {
  const { user, hasPermission, refreshUser } = useAuth()

  const canCreate = hasPermission('creer_acteurs')
  const canModify = hasPermission('modifier_acteurs')
  const canDesactivate = hasPermission('desactiver_acteurs')
  const canApprouverModification = hasPermission('approuver_modification_user')
  const isAdmin = user?.role?.libelle === 'Admin'

  const [rows, setRows]         = useState([])
  const [meta, setMeta]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [roles, setRoles]       = useState([])
  const [agences, setAgences]           = useState([])
  const [directions, setDirections]     = useState([])
  const [departements, setDepartements] = useState([])
  const [services, setServices]         = useState([])

  const defaultFilters = { search: '', role_id: '', is_active: '', agence_id: '', page: 1 }
  const [filters, setFilters] = useState(defaultFilters)
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

  // Modal approbation modification
  const [reviewModal, setReviewModal] = useState({ open: false, item: null })
  const [detailModal, setDetailModal] = useState({ open: false, item: null })

  // Confirmation modals
  const [submitConfirm, setSubmitConfirm]           = useState(false)
  const [deactivateModal, setDeactivateModal]       = useState({ open: false, user: null })
  const [activateConfirm, setActivateConfirm]       = useState({ open: false, user: null })
  const [activationError, setActivationError]       = useState('')
  const [deactivatedListOpen, setDeactivatedListOpen] = useState(false)
  const [permsConfirm, setPermsConfirm]             = useState(false)

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

  function resetFilters() {
    setFilters(defaultFilters)
  }

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
        const { data } = await api.put(`/users/${editing}`, form)
        setSuccess(data?.message || 'Modifications proposées. En attente de validation.')
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

  async function handleDeactivate(motif) {
    const targetUser = deactivateModal.user
    if (!targetUser) return
    try {
      await api.patch(`/users/${targetUser.id}/toggle-status`, { motif })
      setSuccess(`Le compte de ${targetUser.nom} a été désactivé.`)
      setDeactivateModal({ open: false, user: null })
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function handleActivate() {
    const targetUser = activateConfirm.user
    if (!targetUser) return
    setActivationError('')
    try {
      await api.patch(`/users/${targetUser.id}/toggle-status`)
      setSuccess(`Le compte de ${targetUser.nom} a été réactivé.`)
      setActivateConfirm({ open: false, user: null })
      setDeactivatedListOpen(false)
      load()
    } catch (err) {
      setActivationError(getApiError(err))
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

  // Fonctions d'approbation des modifications
  async function approuverModification(id) {
    try {
      await api.post(`/users/${id}/approuver-modification`)
      setSuccess('Modifications appliquées définitivement.')
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function rejeterModification(id) {
    try {
      await api.post(`/users/${id}/rejeter-modification`)
      setSuccess('Modifications rejetées. Les données restent inchangées.')
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  const originalPermissions = useRef([])

  function openPermModal(user) {
    if (!isAdmin) return
    setPermModal({ open: true, user })
    setLoadingPerms(true)
    setSelectedPerms([])
    setRolePerms([])

    api.get(`/users/${user.id}`)
      .then(({ data }) => {
        const u = data.data ?? data

        const permsRole = u.role?.permissions?.map(p => p.libelle) ?? []
        setRolePerms(permsRole)

        const toutesPerms = Array.isArray(u.toutes_permissions)
          ? u.toutes_permissions
          : Object.values(u.toutes_permissions ?? {})
        setSelectedPerms(toutesPerms)
        originalPermissions.current = [...toutesPerms]
      })
      .finally(() => setLoadingPerms(false))
  }

  async function executeSavePermissions() {
    if (!isAdmin) return
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
      if (permModal.user.id === user?.id) {
        await refreshUser()
      }
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
      render: (row) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge status={row.is_active ? 'actif' : 'inactif'} />
          {row.statut_modification === 'en_attente_validation_modification' && (
            <StatusBadge status="en_attente_validation_modification" />
          )}
        </div>
      ),
    },
    // Actions avant Modification
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          {row.statut_modification === 'en_attente_validation_modification' && canApprouverModification ? (
            <IconActionButton
              icon={Eye}
              label="Voir les modifications"
              tone="info"
              onClick={() => setReviewModal({ open: true, item: row })}
            />
          ) : (
            <IconActionButton
              icon={Eye}
              label="Voir"
              onClick={() => setDetailModal({ open: true, item: row })}
            />
          )}
          {canModify && (
            <IconActionButton
              icon={Edit}
              label="Modifier"
              onClick={() => startEdit(row)}
            />
          )}
          {isAdmin && (
            <IconActionButton
              icon={Shield}
              label="Permissions"
              tone="primary"
              onClick={() => openPermModal(row)}
            />
          )}
          {canDesactivate && (
            <IconActionButton
              icon={row.is_active ? ToggleRight : ToggleLeft}
              label={row.is_active ? 'Désactiver' : 'Activer'}
              tone={row.is_active ? 'danger' : 'success'}
              onClick={() => {
                if (row.is_active) {
                  setDeactivateModal({ open: true, user: row })
                } else {
                  setActivateConfirm({ open: true, user: row })
                }
              }}
            />
          )}
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
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            className="field pl-9 w-full"
            placeholder="Rechercher..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
        </div>
        <select
          className="field w-full"
          value={filters.role_id}
          onChange={(e) => setFilters({ ...filters, role_id: e.target.value, page: 1 })}
        >
          <option value="">Tous les rôles</option>
          {roles.map((r) => <option key={r.id} value={r.id}>{r.libelle}</option>)}
        </select>
        <select
          className="field w-full"
          value={filters.is_active}
          onChange={(e) => setFilters({ ...filters, is_active: e.target.value, page: 1 })}
        >
          <option value="">Tous statuts</option>
          <option value="1">Actifs</option>
          <option value="0">Inactifs</option>
        </select>
        <select
          className="field w-full"
          value={filters.agence_id}
          onChange={(e) => setFilters({ ...filters, agence_id: e.target.value, page: 1 })}
        >
          <option value="">Toutes agences</option>
          {agences.map((a) => (
            <option key={a.id} value={a.id}>{a.libelle}</option>
          ))}
        </select>
        <button
          onClick={resetFilters}
          className="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 transition"
        >
          <RefreshCw size={14} /> Réinitialiser
        </button>
      </div>

      {/* Bouton comptes désactivés si formulaire non affiché */}
      {!(editing ? canModify : canCreate) && canDesactivate && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setDeactivatedListOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 transition cursor-pointer"
          >
            <UserX size={14} /> Comptes désactivés
          </button>
        </div>
      )}

      {/* Formulaire */}
      {(editing ? canModify : canCreate) && (
        <form
          onSubmit={(e) => { e.preventDefault(); setSubmitConfirm(true) }}
          className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <h3 className="mb-3 text-sm font-bold text-slate-700">
            {editing ? 'Modifier un acteur' : 'Créer un acteur'}
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nom complet <span className="text-slate-700">*</span>
              </label>
              <input className="field mt-1" placeholder="Nom complet"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Email <span className="text-slate-700">*</span>
              </label>
              <input className="field mt-1" type="email" placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Adresse <span className="text-slate-700">*</span>
              </label>
              <input className="field mt-1" placeholder="Adresse"
                value={form.adresse}
                onChange={(e) => setForm({ ...form, adresse: e.target.value })}
                required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Fonction <span className="text-slate-700">*</span>
              </label>
              <input className="field mt-1" placeholder="Fonction (ex: Directeur, Caissier...)"
                value={form.fonction}
                onChange={(e) => setForm({ ...form, fonction: e.target.value })}
                required />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Rôle <span className="text-slate-700">*</span>
              </label>
              <select className="field mt-1" value={form.role_id}
                onChange={(e) => setForm({ ...form, role_id: e.target.value })}
                required>
                <option value="">Sélectionner un rôle</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.libelle}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Agence <span className="text-slate-700">*</span>
              </label>
              <select className="field mt-1" value={form.agence_id}
                onChange={(e) => handleAgenceChange(e.target.value)}
                required>
                <option value="">Sélectionner une agence</option>
                {agences.map((a) => <option key={a.id} value={a.id}>{a.libelle}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Direction <span className="text-slate-700">*</span>
              </label>
              <select className="field mt-1" value={form.direction_id}
                onChange={(e) => handleDirectionChange(e.target.value)}
                disabled={!form.agence_id}
                required>
                <option value="">Sélectionner une direction</option>
                {directions.map((d) => <option key={d.id} value={d.id}>{d.libelle}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Département <span className="text-slate-700">*</span>
              </label>
              <select className="field mt-1" value={form.departement_id}
                onChange={(e) => handleDepartementChange(e.target.value)}
                disabled={!form.direction_id}
                required>
                <option value="">Sélectionner un département</option>
                {departements.map((d) => <option key={d.id} value={d.id}>{d.libelle}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">
                Service <span className="text-slate-700">*</span>
              </label>
              <select className="field mt-1" value={form.service_id}
                onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                disabled={!form.departement_id}
                required>
                <option value="">Sélectionner un service</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.libelle}</option>)}
              </select>
            </div>
          </div>

          {!editing && (
            <p className="mt-2 text-xs text-slate-400">
              Le mot de passe initial sera{' '}
              <span className="font-mono font-semibold">00000000</span>.
              L'acteur devra le changer à sa première connexion.
            </p>
          )}

          <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-2">
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

            {canDesactivate && (
              <button
                type="button"
                onClick={() => setDeactivatedListOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100 transition cursor-pointer"
              >
                <UserX size={14} /> Comptes désactivés
              </button>
            )}
          </div>
        </form>
      )}

      <DataTable
        columns={columns}
        rows={rows}
        meta={meta}
        loading={loading}
        onPage={(page) => setFilters({ ...filters, page })}
      />

      {/* Modal permissions - UNIQUEMENT pour les Admins */}
      {isAdmin && permModal.open && (
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

      {/* Modal désactivation compte avec motif */}
      <DeactivateUserModal
        open={deactivateModal.open}
        user={deactivateModal.user}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateModal({ open: false, user: null })}
      />

      {/* Modal liste des comptes désactivés */}
      <DeactivatedUsersModal
        open={deactivatedListOpen}
        onClose={() => setDeactivatedListOpen(false)}
        onActivate={(targetUser) => {
          setActivationError('')
          setActivateConfirm({ open: true, user: targetUser })
        }}
      />

      {/* Modal confirmation activation compte */}
      <ConfirmModal
        open={activateConfirm.open}
        title="Activer ce compte ?"
        message={`Êtes-vous sûr de vouloir réactiver le compte de ${activateConfirm.user?.nom ?? ''} ?`}
        error={activationError}
        confirmText="Activer"
        onConfirm={handleActivate}
        onCancel={() => {
          setActivationError('')
          setActivateConfirm({ open: false, user: null })
        }}
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

      {/* Modal approbation des modifications */}
      <ModificationReviewModal
        open={reviewModal.open}
        item={reviewModal.item}
        fieldLabels={USER_FIELD_LABELS}
        fieldLabels={USER_FIELD_LABELS}
        onConfirm={async () => {
          const id = reviewModal.item?.id
          setReviewModal({ open: false, item: null })
          if (id) await approuverModification(id)
        }}
        onReject={async () => {
          const id = reviewModal.item?.id
          setReviewModal({ open: false, item: null })
          if (id) await rejeterModification(id)
        }}
        onClose={() => setReviewModal({ open: false, item: null })}
      />

      <DetailModal
        open={detailModal.open}
        onClose={() => setDetailModal({ open: false, item: null })}
        title={detailModal.item ? `${detailModal.item.nom}` : 'Acteur'}
        fields={detailModal.item ? [
          { label: 'Nom', value: detailModal.item.nom },
          { label: 'Email', value: detailModal.item.email },
          { label: 'Adresse', value: detailModal.item.adresse },
          { label: 'Fonction', value: detailModal.item.fonction },
          { label: 'Rôle', value: detailModal.item.role?.libelle ?? '—' },
          { label: 'Agence', value: detailModal.item.agence ?? '—' },
          { label: 'Direction', value: detailModal.item.direction ?? '—' },
          { label: 'Département', value: detailModal.item.departement ?? '—' },
          { label: 'Service', value: detailModal.item.service?.libelle ?? '—' },
          {
            label: 'Statut',
            value: <StatusBadge status={detailModal.item.is_active ? 'actif' : 'inactif'} />,
          },
          ...(!detailModal.item.is_active ? [
            { label: 'Désactivé par', value: detailModal.item.desactive_par_nom ?? '—' },
            { label: 'Désactivé le', value: formatDate(detailModal.item.desactive_le) },
            { label: 'Motif de désactivation', value: detailModal.item.motif_desactivation ?? '—' },
          ] : []),
          { label: 'Créé le', value: formatDate(detailModal.item.created_at) },
          { label: 'Mis à jour le', value: formatDate(detailModal.item.updated_at) },
        ] : []}
      />
    </>
  )
}