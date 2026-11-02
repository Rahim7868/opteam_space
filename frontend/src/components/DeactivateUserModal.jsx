import { AlertTriangle, UserX, X } from 'lucide-react'
import { useState } from 'react'

export default function DeactivateUserModal({ open, user, onConfirm, onCancel }) {
  const [motif, setMotif] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!open || !user) return null

  const handleConfirm = async () => {
    if (!motif.trim()) {
      setError('Veuillez saisir un motif.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await onConfirm(motif.trim())
      setMotif('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    setError('')
    setMotif('')
    onCancel()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="animate-enter w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <UserX size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Désactiver le compte utilisateur
              </h3>
              <p className="text-xs text-slate-500">
                {user.nom} ({user.email})
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info alert */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-800">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-rose-600" />
          <span>
            Cet utilisateur ne pourra plus se connecter et ses sessions actives seront immédiatement révoquées.
          </span>
        </div>

        {/* Motif textarea */}
        <div className="mt-4">
          <label className="mb-1 block text-xs font-semibold text-slate-700">
            Motif de désactivation <span className="text-rose-600">*</span>
          </label>
          <textarea
            className="field min-h-[100px] w-full resize-none p-3 text-sm focus:border-rose-400 focus:ring-rose-200"
            placeholder="Ex : Départ de la banque, suspension administrative, changement de poste..."
            value={motif}
            onChange={(e) => {
              setMotif(e.target.value)
              if (error) setError('')
            }}
            disabled={submitting}
          />
          {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={submitting}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="btn bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
          >
            {submitting ? 'Désactivation...' : 'Confirmer la désactivation'}
          </button>
        </div>
      </div>
    </div>
  )
}
