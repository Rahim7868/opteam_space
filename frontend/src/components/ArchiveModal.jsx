import { ArchiveRestore, ListChecks, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { getApiError } from '../api/client'
import ConfirmModal from './ConfirmModal'
import DataTable from './DataTable'
import IconActionButton from './IconActionButton'
import ErrorAlert from './ErrorAlert'
import SuccessAlert from './SuccessAlert'

export default function ArchiveModal({
  open,
  onClose,
  title = 'Archives',
  itemLabel = 'cet élément',
  columns,
  rows,
  loading,
  canRestore = false,
  canForceDelete = false,
  onRestore,
  onForceDelete,
  onRestoreMany,
  onForceDeleteMany,
}) {
  const [confirm, setConfirm] = useState({ type: null, row: null })
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [selectionMode, setSelectionMode] = useState(false)

  if (!open) return null

  function handleClose() {
    setError('')
    setSuccess('')
    setConfirm({ type: null, row: null })
    setSelectedIds([])
    setSelectionMode(false)
    onClose()
  }

  function toggleSelectionMode() {
    if (selectionMode) {
      setSelectionMode(false)
      setSelectedIds([])
      return
    }

    setSelectionMode(true)
  }

  function toggleAllRows() {
    const allSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id))
    setSelectedIds(allSelected ? [] : rows.map((row) => row.id))
  }

  function toggleRow(id) {
    setSelectedIds((current) => current.includes(id)
      ? current.filter((selectedId) => selectedId !== id)
      : [...current, id]
    )
  }

  async function run() {
    const { type, row } = confirm
    setError('')
    setSuccess('')
    try {
      let message
      if (type === 'restore') message = await onRestore(row)
      if (type === 'force') message = await onForceDelete(row)
      if (type === 'restore-many') message = await onRestoreMany(selectedIds)
      if (type === 'force-many') message = await onForceDeleteMany(selectedIds)
      if (message) setSuccess(message)
      setSelectedIds(type.endsWith('-many')
        ? []
        : selectedIds.filter((id) => id !== row?.id)
      )
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setConfirm({ type: null, row: null })
    }
  }

  const allColumns = [
    ...(selectionMode ? [{
      key: 'selection',
      label: (
        <input
          type="checkbox"
          aria-label="Sélectionner toutes les archives"
          className="h-4 w-4 accent-teal-700"
          checked={rows.length > 0 && rows.every((row) => selectedIds.includes(row.id))}
          onChange={toggleAllRows}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          aria-label={`Sélectionner ${row.designation}`}
          className="h-4 w-4 accent-teal-700"
          checked={selectedIds.includes(row.id)}
          onChange={() => toggleRow(row.id)}
        />
      ),
    }] : []),
    ...columns,
  ]

  if (canRestore || canForceDelete) {
    allColumns.push({
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-1">
          {canRestore && (
            <IconActionButton
              icon={ArchiveRestore}
              label="Restaurer"
              tone="success"
              onClick={() => setConfirm({ type: 'restore', row })}
            />
          )}
          {canForceDelete && (
            <IconActionButton
              icon={Trash2}
              label="Supprimer définitivement"
              tone="danger"
              onClick={() => setConfirm({ type: 'force', row })}
            />
          )}
        </div>
      ),
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
        <div className="animate-enter w-full max-w-4xl rounded-3xl border border-white/70 bg-white p-6 shadow-2xl shadow-slate-950/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
              <p className="mt-1 text-sm text-slate-500">
                Éléments archivés. Vous pouvez les restaurer ou les supprimer définitivement.
              </p>
            </div>
            <button onClick={handleClose} className="btn btn-secondary px-2" aria-label="Fermer">
              <X size={16} />
            </button>
          </div>

          <div className="mt-4">
            <ErrorAlert message={error} onDismiss={() => setError('')} />
            <SuccessAlert message={success} onDismiss={() => setSuccess('')} />
          </div>

          {(canRestore || canForceDelete) && (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <button
                type="button"
                aria-pressed={selectionMode}
                onClick={toggleSelectionMode}
                className="btn btn-secondary"
              >
                <ListChecks size={16} />
                {selectionMode ? 'Annuler la sélection' : 'Sélectionner'}
              </button>
              {selectionMode && (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-slate-600">
                    {selectedIds.length} {selectedIds.length === 1 ? 'bureau sélectionné' : 'bureaux sélectionnés'}
                  </span>
                  <div className="flex gap-1">
                    {canRestore && (
                      <IconActionButton
                        icon={ArchiveRestore}
                        label={selectedIds.length === 1 ? 'Restaurer le bureau sélectionné' : `Restaurer les ${selectedIds.length} bureaux sélectionnés`}
                        tone="success"
                        disabled={selectedIds.length === 0}
                        onClick={() => setConfirm({ type: 'restore-many', row: null })}
                      />
                    )}
                    {canForceDelete && (
                      <IconActionButton
                        icon={Trash2}
                        label={selectedIds.length === 1 ? 'Supprimer définitivement le bureau sélectionné' : `Supprimer définitivement les ${selectedIds.length} bureaux sélectionnés`}
                        tone="danger"
                        disabled={selectedIds.length === 0}
                        onClick={() => setConfirm({ type: 'force-many', row: null })}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="max-h-[60vh] overflow-y-auto">
            <DataTable columns={allColumns} rows={rows} loading={loading} />
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirm.type === 'restore' || confirm.type === 'restore-many'}
        title={confirm.type === 'restore-many' ? 'Confirmer la restauration groupée' : 'Confirmer la restauration'}
        message={confirm.type === 'restore-many'
          ? `Voulez-vous restaurer les ${selectedIds.length} bureaux sélectionnés ? Ils réapparaîtront dans la liste principale.`
          : `Voulez-vous restaurer ${itemLabel} ? Il réapparaîtra dans la liste principale.`}
        confirmText="Restaurer"
        onConfirm={run}
        onCancel={() => setConfirm({ type: null, row: null })}
      />
      <ConfirmModal
        open={confirm.type === 'force' || confirm.type === 'force-many'}
        title={confirm.type === 'force-many' ? 'Confirmer la suppression groupée définitive' : 'Confirmer la suppression définitive'}
        message={confirm.type === 'force-many'
          ? `Voulez-vous supprimer définitivement les ${selectedIds.length} bureaux sélectionnés ? Cette action est irréversible.`
          : `Voulez-vous supprimer définitivement ${itemLabel} ? Cette action est irréversible.`}
        confirmText="Supprimer définitivement"
        danger={true}
        onConfirm={run}
        onCancel={() => setConfirm({ type: null, row: null })}
      />
    </>
  )
}