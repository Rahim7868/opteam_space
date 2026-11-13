import { Plus, X } from 'lucide-react'
import { useEffect } from 'react'

export default function FormModal({
  open,
  onClose,
  title,
  subtitle,
  editing = false,
  closeOnEscape = true,
  icon: Icon = Plus,
  size = 'max-w-3xl',
  children,
}) {
  useEffect(() => {
    if (!open) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (closeOnEscape && event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose, closeOnEscape])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
        className={`animate-enter flex max-h-[92vh] w-full ${size} flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/30`}
      >
        <header className="relative shrink-0 overflow-hidden border-b border-slate-100 bg-gradient-to-br from-teal-50 via-white to-slate-50 px-5 py-5 sm:px-7">
          <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full bg-teal-100/60 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-lg shadow-teal-700/20">
                <Icon size={21} />
              </div>
              <div className="min-w-0">
                <span className="inline-flex rounded-full bg-teal-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-teal-800">
                  {editing ? 'Modification' : 'Nouvel enregistrement'}
                </span>
                <h2 id="form-modal-title" className="mt-1.5 truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  {title}
                </h2>
                {subtitle && <p className="mt-1 text-sm leading-5 text-slate-500">{subtitle}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="relative rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700 hover:shadow-sm"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>
        </header>
        <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {children}
        </div>
      </section>
    </div>
  )
}
