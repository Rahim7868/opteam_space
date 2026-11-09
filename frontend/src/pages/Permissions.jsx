import { Edit, Eye, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import api, { getApiError } from '../api/client'
import ConfirmModal from '../components/ConfirmModal'
import DataTable from '../components/DataTable'
import IconActionButton from '../components/IconActionButton'
import ErrorAlert from '../components/ErrorAlert'
import SuccessAlert from '../components/SuccessAlert'
import PageHeader from '../components/PageHeader'
import DetailModal, { formatDate } from '../components/DetailModal'

const emptyForm = { libelle: '' }

export default function Permissions() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const originalForm = useRef(null)
  const [search, setSearch]   = useState('')
  const [confirmModal, setConfirmModal] = useState({ open: false, id: null })
  const [submitConfirm, setSubmitConfirm] = useState(false)
  const [detailModal, setDetailModal]     = useState({ open: false, item: null })

  function load() {
    setLoading(true)
    api.get('/permissions')
      .then(({ data }) => setRows(data.data ?? data))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function submit() {
    setError(''); setSuccess('')
    try {
      if (editing) {
        if (JSON.stringify(form) === JSON.stringify(originalForm.current)) {
          setForm(emptyForm); setEditing(null)
          return
        }
        await api.put(`/permissions/${editing}`, form)
        setSuccess('Permission mise à jour.')
      } else {
        await api.post('/permissions', form)
        setSuccess('Permission créée.')
      }
      setForm(emptyForm); setEditing(null); load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function destroy(id) {
    try {
      await api.delete(`/permissions/${id}`)
      setSuccess('Permission supprimée.')
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  const filtered = rows.filter((r) =>
    r.libelle.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: 'libelle', label: 'Libellé' },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          <IconActionButton
            icon={Eye}
            label="Voir"
            onClick={() => setDetailModal({ open: true, item: row })}
          />
          <IconActionButton
            icon={Edit}
            label="Modifier"
            onClick={() => { setEditing(row.id); setForm({ libelle: row.libelle }); originalForm.current = { libelle: row.libelle } }}
          />
          <IconActionButton
            icon={Trash2}
            label="Supprimer"
            tone="danger"
            onClick={() => setConfirmModal({ open: true, id: row.id })}
          />
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Permissions"
        subtitle="Gestion des permissions disponibles dans l'application."
      />

      <ErrorAlert message={error} onDismiss={() => setError('')} />
      <SuccessAlert message={success} onDismiss={() => setSuccess('')} />

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            className="field pl-9"
            placeholder="Rechercher une permission..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setSubmitConfirm(true) }}
        className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex gap-3 items-end"
      >
        <div className="flex-1">
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            {editing ? 'Modifier la permission' : 'Nouvelle permission'}
          </label>
          <input
            className="field"
            placeholder="ex: creer_fixing, valider_bureau_change... *"
            value={form.libelle}
            onChange={(e) => setForm({ libelle: e.target.value })}
            required
          />
        </div>
        <button className="btn btn-primary">
          <Plus size={16} />
          {editing ? 'Enregistrer' : 'Ajouter'}
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
      </form>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
      />

      <ConfirmModal
        open={confirmModal.open}
        title="Confirmer la suppression"
        message="Cette action est irréversible."
        danger={true}
        confirmText="Supprimer"
        onConfirm={async () => {
          await destroy(confirmModal.id)
          setConfirmModal({ open: false, id: null })
        }}
        onCancel={() => setConfirmModal({ open: false, id: null })}
      />

      <ConfirmModal
        open={submitConfirm}
        title={editing ? 'Confirmer la modification ?' : 'Confirmer la création ?'}
        message={editing ? 'Les modifications seront enregistrées définitivement.' : 'Êtes-vous sûr de vouloir créer cet élément ?'}
        confirmText={editing ? 'Enregistrer' : 'Confirmer'}
        onConfirm={async () => { setSubmitConfirm(false); await submit() }}
        onCancel={() => setSubmitConfirm(false)}
      />

      <DetailModal
        open={detailModal.open}
        onClose={() => setDetailModal({ open: false, item: null })}
        title={detailModal.item ? detailModal.item.libelle : 'Permission'}
        fields={detailModal.item ? [
          { label: 'Libellé', value: detailModal.item.libelle },
          { label: 'Créé le', value: formatDate(detailModal.item.created_at) },
        ] : []}
      />
    </>
  )
}