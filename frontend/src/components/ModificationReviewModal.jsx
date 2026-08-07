import { Check, X, Eye } from 'lucide-react'
import { useState } from 'react'
import ConfirmModal from './ConfirmModal'

export const FIXING_FIELD_LABELS = {
  date_fixing: 'Date du fixing',
  devise: 'Devise',
  cours: 'Cours',
  piece_jointe: 'Pièce jointe',
  commentaire: 'Commentaire',
}

export const BUREAU_FIELD_LABELS = {
  numero_ordre: 'N° Ordre',
  designation: 'Désignation',
  numero_agrement: 'N° Agrément',
  representant_legal: 'Représentant légal',
  contact: 'Contact',
  adresse: 'Adresse',
  commentaire: 'Commentaire',
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '—'
  return String(value)
}

// 🔥 Génère une URL de fichier à partir d'un chemin
function generateFileUrl(filePath) {
  // 🔥 Vérifier que filePath est une chaîne
  if (!filePath || typeof filePath !== 'string') return null
  
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) return filePath
  if (filePath.startsWith('/storage')) return filePath
  if (filePath.startsWith('storage')) return '/' + filePath
  return `/storage/${filePath}`
}

function renderFileLink(value, url) {
  // 🔥 Si on a une URL, afficher le lien "Voir"
  if (url) {
    return (
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-teal-600 hover:underline font-medium text-xs"
      >
        <Eye size={13} /> Voir
      </a>
    )
  }
  
  // 🔥 Si on a un nom de fichier mais pas d'URL, essayer de générer l'URL
  if (value && typeof value === 'string') {
    const generatedUrl = generateFileUrl(value)
    if (generatedUrl) {
      return (
        <a 
          href={generatedUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-teal-600 hover:underline font-medium text-xs"
        >
          <Eye size={13} /> Voir
        </a>
      )
    }
    return (
      <span className="text-slate-500 text-xs">
        📎 {value.split('/').pop()}
      </span>
    )
  }
  
  return '—'
}

export default function ModificationReviewModal({
  open,
  item,
  fieldLabels = {},
  onConfirm,
  onReject,
  onClose,
}) {
  const [confirmModal, setConfirmModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)

  if (!open || !item || !item.modification_proposee) return null

  const proposed = item.modification_proposee

  // 🔥 URLs des fichiers (ancien et nouveau)
  const oldFileUrl = item.piece_jointe_url || generateFileUrl(item.piece_jointe)
  const newFileUrl = proposed.piece_jointe_url || generateFileUrl(proposed.piece_jointe)

  const changes = Object.keys(proposed)
    .filter((key) => {
      if (key === 'piece_jointe_url') return false
      const oldVal = String(item[key] ?? '')
      const newVal = String(proposed[key] ?? '')
      return oldVal !== newVal
    })
    .map((key) => ({
      key,
      label: fieldLabels[key] || key,
      oldValue: item[key],
      newValue: proposed[key],
    }))

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
        <div className="animate-enter w-full max-w-2xl rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/20">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  👁️ Modifications proposées
                </h3>
                {item.modification_proposee_par_nom && (
                  <p className="mt-1 text-sm text-slate-500">
                    Proposées par{' '}
                    <span className="font-semibold text-slate-700">
                      {item.modification_proposee_par_nom}
                    </span>
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="px-6 py-5">
            {changes.length === 0 ? (
              <p className="text-center text-sm text-slate-500">
                Aucune modification détectée.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Champ
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Ancienne valeur
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                        Nouvelle valeur
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {changes.map(({ key, label, oldValue, newValue }) => {
                      const isFileField = key === 'piece_jointe'

                      let oldDisplay
                      let newDisplay
                      
                      if (isFileField) {
                        oldDisplay = renderFileLink(oldValue, oldFileUrl)
                        newDisplay = renderFileLink(newValue, newFileUrl)
                      } else {
                        oldDisplay = (
                          <span className="inline-flex rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                            {formatValue(oldValue)}
                          </span>
                        )
                        newDisplay = (
                          <span className="inline-flex rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                            {formatValue(newValue)}
                          </span>
                        )
                      }

                      return (
                        <tr key={key} className="transition hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-semibold text-slate-700">
                            {label}
                          </td>
                          <td className="px-4 py-3">
                            {oldDisplay}
                          </td>
                          <td className="px-4 py-3">
                            {newDisplay}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {changes.length > 0 && (
            <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
              <button
                onClick={() => setRejectModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-50 px-5 py-2.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100"
              >
                <X size={16} /> Annuler les modifications
              </button>
              <button
                onClick={() => setConfirmModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <Check size={16} /> Confirmer les modifications
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmModal}
        title="Êtes-vous sûr de vouloir confirmer ces modifications ?"
        message="Les modifications seront appliquées définitivement et remplaceront les anciennes valeurs."
        confirmText="Oui, confirmer"
        cancelText="Non"
        onConfirm={() => {
          setConfirmModal(false)
          onConfirm?.()
        }}
        onCancel={() => setConfirmModal(false)}
      />

      <ConfirmModal
        open={rejectModal}
        title="Êtes-vous sûr de vouloir annuler ces modifications ?"
        message="Les modifications proposées seront rejetées et les données resteront inchangées."
        danger
        confirmText="Oui, annuler"
        cancelText="Non"
        onConfirm={() => {
          setRejectModal(false)
          onReject?.()
        }}
        onCancel={() => setRejectModal(false)}
      />
    </>
  )
}