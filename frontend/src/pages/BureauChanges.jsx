import { Check, Edit, Plus, Search, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import api, { getApiError } from '../api/client'
import ConfirmModal from '../components/ConfirmModal'
import DataTable from '../components/DataTable'
import ErrorAlert from '../components/ErrorAlert'
import SuccessAlert from '../components/SuccessAlert'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'

const emptyForm = {
  numero_ordre: '', designation: '', numero_agrement: '',
  representant_legal: '', contact: '', adresse: '',
}

export default function BureauChanges() {
  const { hasPermission, user } = useAuth()

  const canCreate   = hasPermission('creer_bureau_change')
  const canModify   = hasPermission('modifier_bureau_change')
  const canValidate = hasPermission('valider_bureau_change')
  const canReject   = hasPermission('rejeter_bureau_change')

  const [rows, setRows]       = useState([])
  const [meta, setMeta]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ search: '', statut: '', page: 1 })
  const [form, setForm]       = useState(emptyForm)
  const [editing, setEditing] = useState(null)
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const originalForm          = useRef(null)

  // Import Excel
  const [importModal, setImportModal]   = useState(false)
  const [importFile, setImportFile]     = useState(null)
  const [importing, setImporting]       = useState(false)
  const [importResult, setImportResult] = useState(null)

  // Confirmation modals
  const [submitConfirm, setSubmitConfirm]       = useState(false)
  const [validateConfirm, setValidateConfirm]   = useState({ open: false, id: null })
  const [rejectConfirm, setRejectConfirm]       = useState({ open: false, id: null })

  function load() {
    setLoading(true)
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '')
    )
    api.get('/bureau-changes', { params })
      .then(({ data }) => { setRows(data.data); setMeta(data.meta) })
      .finally(() => setLoading(false))
  }

  useEffect(load, [filters])

  async function submit() {
    setError(''); setSuccess('')
    try {
      if (editing) {
        if (JSON.stringify(form) === JSON.stringify(originalForm.current)) {
          setForm(emptyForm); setEditing(null)
          return
        }
        await api.put(`/bureau-changes/${editing}`, form)
        setSuccess('Bureau de change modifié avec succès.')
      } else {
        await api.post('/bureau-changes', form)
        setSuccess('Bureau de change créé avec succès.')
      }
      setForm(emptyForm); setEditing(null); load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function valider(id) {
    try {
      await api.post(`/bureau-changes/${id}/valider`)
      setSuccess('Bureau de change validé.')
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  async function rejeter(id) {
    try {
      await api.post(`/bureau-changes/${id}/rejeter`, {})
      setSuccess('Bureau de change rejeté.')
      load()
    } catch (err) {
      setError(getApiError(err))
    }
  }

  function startEdit(row) {
    setEditing(row.id)
    const data = {
      numero_ordre:       row.numero_ordre ?? '',
      designation:        row.designation,
      numero_agrement:    row.numero_agrement,
      representant_legal: row.representant_legal,
      contact:            row.contact ?? '',
      adresse:            row.adresse ?? '',
    }
    setForm(data)
    originalForm.current = { ...data }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleImport(e) {
    e.preventDefault()
    if (!importFile) return

    setImporting(true)
    setImportResult(null)

    const payload = new FormData()
    payload.append('fichier', importFile)

    try {
      const { data } = await api.post('/bureau-changes/import', payload)
      setImportResult(data)
      load()
    } catch (err) {
      setError(getApiError(err))
      setImportModal(false)
    } finally {
      setImporting(false)
    }
  }

  const columns = [
    { key: 'numero_ordre',       label: 'N° Ordre' },
    { key: 'designation',        label: 'Désignation' },
    { key: 'numero_agrement',    label: 'N° Agrément' },
    { key: 'representant_legal', label: 'Représentant' },
    {
      key: 'contact', label: 'Contact',
      render: (row) => row.contact || <span className="text-slate-400">N/A</span>,
    },
    {
      key: 'adresse', label: 'Adresse',
      render: (row) => row.adresse || <span className="text-slate-400">N/A</span>,
    },
    {
      key: 'createur', label: 'Créé par',
      render: (row) => row.createur?.nom ?? <span className="text-slate-400">N/A</span>,
    },
    {
      key: 'statut', label: 'Statut',
      render: (row) => <StatusBadge status={row.statut} />,
    },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {canModify && row.statut === 'en_attente' && row.createur?.id === user?.id && (
            <button onClick={() => startEdit(row)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
              <Edit size={13} /> Modifier
            </button>
          )}
          {canValidate && row.statut === 'en_attente' && (
            <button onClick={() => setValidateConfirm({ open: true, id: row.id })}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100">
              <Check size={13} /> Valider
            </button>
          )}
          {canReject && row.statut === 'en_attente' && (
            <button onClick={() => setRejectConfirm({ open: true, id: row.id })}
              className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100">
              <X size={13} /> Rejeter
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Bureaux de change"
        subtitle="Gestion et validation des bureaux de change."
        action={
          canCreate && (
            <button
              onClick={() => { setImportModal(true); setImportResult(null); setImportFile(null) }}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              <Upload size={16} /> Importer Excel
            </button>
          )
        }
      />

      <ErrorAlert message={error} onDismiss={() => setError('')} />
      <SuccessAlert message={success} onDismiss={() => setSuccess('')} />

      {/* Filtres */}
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_180px]">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input className="field pl-9"
            placeholder="Rechercher par désignation ou agrément..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} />
        </div>
        <select className="field" value={filters.statut}
          onChange={(e) => setFilters({ ...filters, statut: e.target.value, page: 1 })}>
          <option value="">Tous statuts</option>
          <option value="en_attente">En attente</option>
          <option value="valide">Validés</option>
          <option value="rejete">Rejetés</option>
        </select>
      </div>

      {/* Formulaire création/modification */}
      {(canCreate || (canModify && editing)) && (
        <form onSubmit={(e) => { e.preventDefault(); setSubmitConfirm(true) }}
          className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-bold text-slate-700">
            {editing ? 'Modifier le bureau de change' : 'Ajouter un bureau de change'}
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <input className="field" placeholder="N° Ordre *"
              value={form.numero_ordre}
              onChange={(e) => setForm({ ...form, numero_ordre: e.target.value })}
              required />
            <input className="field" placeholder="Désignation *"
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              required />
            <input className="field" placeholder="N° Agrément *"
              value={form.numero_agrement}
              onChange={(e) => setForm({ ...form, numero_agrement: e.target.value })}
              required />
            <input className="field" placeholder="Représentant légal *"
              value={form.representant_legal}
              onChange={(e) => setForm({ ...form, representant_legal: e.target.value })}
              required />
            <input className="field" placeholder="Contact"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            <input className="field" placeholder="Adresse"
              value={form.adresse}
              onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn btn-primary">
              <Plus size={16} /> {editing ? 'Enregistrer' : 'Ajouter'}
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
      )}

      <DataTable
        columns={columns}
        rows={rows}
        meta={meta}
        loading={loading}
        onPage={(page) => setFilters({ ...filters, page })}
      />

      {/* Modal confirmation création/modification */}
      <ConfirmModal
        open={submitConfirm}
        title={editing ? 'Confirmer la modification ?' : 'Confirmer la création ?'}
        message={editing ? 'Les modifications seront enregistrées définitivement.' : 'Êtes-vous sûr de vouloir créer cet élément ?'}
        confirmText={editing ? 'Enregistrer' : 'Confirmer'}
        onConfirm={async () => { setSubmitConfirm(false); await submit() }}
        onCancel={() => setSubmitConfirm(false)}
      />

      {/* Modal confirmation validation */}
      <ConfirmModal
        open={validateConfirm.open}
        title="Confirmer l'approbation ?"
        message="Êtes-vous sûr de vouloir approuver ce bureau de change ?"
        confirmText="Approuver"
        onConfirm={async () => {
          const id = validateConfirm.id
          setValidateConfirm({ open: false, id: null })
          await valider(id)
        }}
        onCancel={() => setValidateConfirm({ open: false, id: null })}
      />

      {/* Modal confirmation rejet */}
      <ConfirmModal
        open={rejectConfirm.open}
        title="Confirmer le refus ?"
        message="Êtes-vous sûr de vouloir refuser ce bureau de change ?"
        danger
        confirmText="Refuser"
        onConfirm={async () => {
          const id = rejectConfirm.id
          setRejectConfirm({ open: false, id: null })
          await rejeter(id)
        }}
        onCancel={() => setRejectConfirm({ open: false, id: null })}
      />

      {/* Modal Import Excel */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800">
              Importer des bureaux de change
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Le fichier Excel doit contenir les colonnes dans cet ordre :
            </p>

            {/* Exemple de format */}
            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    {['numero_ordre', 'designation', 'numero_agrement', 'representant_legal', 'contact', 'adresse'].map(h => (
                      <th key={h} className="px-2 py-1.5 text-left font-semibold text-slate-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-100">
                    <td className="px-2 py-1.5 text-slate-500">BC001</td>
                    <td className="px-2 py-1.5 text-slate-500">Bureau A</td>
                    <td className="px-2 py-1.5 text-slate-500">AGR-001</td>
                    <td className="px-2 py-1.5 text-slate-500">Jean Dupont</td>
                    <td className="px-2 py-1.5 text-slate-500">620...</td>
                    <td className="px-2 py-1.5 text-slate-500">Conakry</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Résultat import */}
            {importResult && (
              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-semibold text-emerald-700">
                  ✅ {importResult.imported} bureau(x) importé(s)
                  {importResult.skipped > 0 && ` — ${importResult.skipped} ignoré(s)`}
                </p>
                {importResult.errors?.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {importResult.errors.map((err, i) => (
                      <li key={i} className="text-xs text-amber-700">⚠️ {err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {!importResult && (
              <form onSubmit={handleImport} className="mt-4">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="field"
                  onChange={(e) => setImportFile(e.target.files[0])}
                  required
                />
                <div className="mt-4 flex justify-end gap-3">
                  <button type="button"
                    onClick={() => setImportModal(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    Annuler
                  </button>
                  <button type="submit" disabled={importing || !importFile}
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50">
                    {importing
                      ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      : <Upload size={16} />
                    }
                    {importing ? 'Importation...' : 'Importer'}
                  </button>
                </div>
              </form>
            )}

            {importResult && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => { setImportModal(false); setImportResult(null) }}
                  className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}