import { ArchiveRestore, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { getApiError } from '../api/client'
import ConfirmModal from './ConfirmModal'
import DataTable from './DataTable'
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
}) {
  const [confirm, setConfirm] = useState({ type: null, row: null })
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')

  if (!open) return null

  function handleClose() {
    setError('')
    setSuccess('')
    setConfirm({ type: null, row: null })
    onClose()
  }

  async function run() {
    const { type, row } = confirm
    setError('')
    setSuccess('')
    try {
      const message = type === 'restore' ? await onRestore(row) : await onForceDelete(row)
      if (message) setSuccess(message)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setConfirm({ type: null, row: null })
    }
  }

  const allColumns = [...columns]

  if (canRestore || canForceDelete) {
    allColumns.push({
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          {canRestore && (
            <button
              onClick={() => setConfirm({ type: 'restore', row })}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100"
            >
              <ArchiveRestore size={13} /> Restaurer
            </button>
          )}
          {canForceDelete && (
            <button
              onClick={() => setConfirm({ type: 'force', row })}
              className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100"
            >
              <Trash2 size={13} /> Supprimer définitivement
            </button>
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

          <div className="max-h-[60vh] overflow-y-auto">
            <DataTable columns={allColumns} rows={rows} loading={loading} />
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirm.type === 'restore'}
        title="Confirmer la restauration"
        message={`Voulez-vous restaurer ${itemLabel} ? Il réapparaîtra dans la liste principale.`}
        confirmText="Restaurer"
        onConfirm={run}
        onCancel={() => setConfirm({ type: null, row: null })}
      />
      <ConfirmModal
        open={confirm.type === 'force'}
        title="Confirmer la suppression définitive"
        message={`Voulez-vous supprimer définitivement ${itemLabel} ? Cette action est irréversible.`}
        confirmText="Supprimer définitivement"
        danger={true}
        onConfirm={run}
        onCancel={() => setConfirm({ type: null, row: null })}
      />
    </>
  )
}