import { X } from 'lucide-react'

export default function ViewPermissionsModal({ isOpen, onClose, title, permissions }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h3 className="text-lg font-bold text-slate-800">
            Permissions de <span className="text-teal-700">{title}</span>
          </h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Liste des permissions */}
        <div className="mt-4 space-y-1">
          {permissions.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-4">
              Aucune permission attribuée à ce rôle.
            </p>
          ) : (
            permissions.map((perm) => (
              <div
                key={perm.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50"
              >
                <span className="h-2 w-2 rounded-full bg-teal-500"></span>
                <span className="text-sm font-medium text-slate-700">
                  {perm.libelle}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t border-slate-200 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}