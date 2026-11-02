import { Eye, X } from 'lucide-react'

export function formatDate(value) {
  if (!value) return '—'
  try {
    const d = new Date(value)
    if (isNaN(d.getTime())) return String(value)
    return d.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(value)
  }
}

export function formatDateOnly(value) {
  if (!value) return '—'
  try {
    const d = new Date(value)
    if (isNaN(d.getTime())) return String(value)
    return d.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return String(value)
  }
}

export default function DetailModal({
  isOpen,
  open,
  onClose,
  title,
  fields = [],
  children,
}) {
  const show = isOpen ?? open
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="animate-enter w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Eye size={18} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 truncate">
              Voir <span className="text-teal-700">{title}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 shrink-0"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 overflow-y-auto pr-1 flex-1">
          {fields.length > 0 && (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              {fields.map((field, idx) => {
                const val = field.value
                const isNil = val === null || val === undefined || val === ''

                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2.5 px-2 gap-1 text-sm"
                  >
                    <span className="font-semibold text-slate-500 text-xs uppercase tracking-wider shrink-0 min-w-[150px]">
                      {field.label}
                    </span>
                    <div className="text-slate-800 font-medium sm:text-right break-words">
                      {isNil ? <span className="text-slate-400">—</span> : val}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {children && <div className="mt-4">{children}</div>}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4 shrink-0">
          <button onClick={onClose} className="btn btn-secondary">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
