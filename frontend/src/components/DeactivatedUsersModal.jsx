import { Search, UserX, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getApiError } from '../api/client'
import { formatDate } from './DetailModal'

export default function DeactivatedUsersModal({ open, onClose }) {
  const [users, setUsers]     = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [search, setSearch]   = useState('')

  useEffect(() => {
    if (open) {
      setLoading(true)
      setError('')
      api.get('/users/desactives')
        .then(({ data }) => setUsers(data.data ?? []))
        .catch((err) => setError(getApiError(err)))
        .finally(() => setLoading(false))
    }
  }, [open])

  if (!open) return null

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      (u.nom || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.motif_desactivation || '').toLowerCase().includes(q) ||
      (u.desactive_par || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="animate-enter w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <UserX size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Comptes utilisateurs désactivés
              </h3>
              <p className="text-xs text-slate-500">
                Historique et motifs des désactivations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="mt-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              className="field pl-9 w-full"
              placeholder="Rechercher par acteur, motif, auteur de la désactivation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        <div className="mt-4 overflow-y-auto flex-1 min-h-[220px]">
          {loading ? (
            <div className="flex h-48 items-center justify-center text-sm text-slate-400">
              Chargement des comptes désactivés...
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-sm">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
              <UserX size={32} className="mb-2 text-slate-300" />
              <p className="text-sm font-medium">Aucun compte désactivé trouvé.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
                <thead className="bg-slate-50 font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-3">Acteur</th>
                    <th className="py-3 px-3">Fonction / Rôle</th>
                    <th className="py-3 px-3">Désactivé par</th>
                    <th className="py-3 px-3">Quand</th>
                    <th className="py-3 px-3">Motif de désactivation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{u.nom}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div>{u.fonction || '—'}</div>
                        <div className="text-[11px] text-teal-700 font-medium">{u.role}</div>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">
                        {u.desactive_par}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">
                        {formatDate(u.desactive_le)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-block rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200/70 break-words max-w-xs">
                          {u.motif_desactivation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 shrink-0">
          <span className="text-xs text-slate-400">
            Total : {filtered.length} compte{filtered.length > 1 ? 's' : ''} désactivé{filtered.length > 1 ? 's' : ''}
          </span>
          <button onClick={onClose} className="btn btn-secondary">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
