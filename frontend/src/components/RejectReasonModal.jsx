import { MessageSquare, X } from 'lucide-react'
import { useState } from 'react'

/**
 * Modale de confirmation de rejet avec saisie d'un motif/commentaire.
 */
export function RejectReasonModal({ open, title, message, onConfirm, onCancel }) {
  const [reason, setReason] = useState('')

  if (!open) return null

  const handleConfirm = () => {
    onConfirm(reason)
    setReason('')
  }

  const handleCancel = () => {
    onCancel()
    setReason('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="animate-enter w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl shadow-slate-950/20">
        <h3 className="text-lg font-semibold text-slate-800">{title || 'Confirmer le refus'}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{message || 'Veuillez saisir le motif du refus :'}</p>

        <div className="mt-4">
          <label className="mb-1 block text-xs font-semibold text-slate-700">Motif du refus (optionnel)</label>
          <textarea
            className="field min-h-[90px] w-full resize-none p-3 text-sm"
            placeholder="Ex : Document incomplet, cours erroné..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={handleCancel} className="btn btn-secondary">
            Annuler
          </button>
          <button onClick={handleConfirm} className="btn bg-rose-600 hover:bg-rose-700 text-white">
            Refuser
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Modale de consultation du motif de refus.
 */
export function ViewReasonModal({ open, title, reason, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="animate-enter w-full max-w-md rounded-3xl border border-white/70 bg-white p-6 shadow-2xl shadow-slate-950/20">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-rose-600 font-semibold text-base">
            <MessageSquare size={18} />
            <h3>{title || 'Motif du refus'}</h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 rounded-2xl bg-rose-50/60 border border-rose-100 p-4">
          <p className="text-sm text-rose-900 whitespace-pre-wrap leading-relaxed">
            {reason && reason.trim() ? reason : <span className="italic text-slate-400">Aucun motif précisé lors du refus.</span>}
          </p>
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="btn btn-secondary">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
