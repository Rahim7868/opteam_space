import { CheckCircle2 } from 'lucide-react'

const styles = {
  actif: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-100',
  inactif: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  en_attente: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  valide: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-100',
  rejete: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  en_attente_validation_modification: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
}

const labels = {
  actif: 'Actif',
  inactif: 'Inactif',
  en_attente: 'En attente',
  valide: 'Validé',
  rejete: 'Rejeté',
  en_attente_validation_modification: 'En attente validation modification',
}

export default function StatusBadge({ status }) {
  const key = status?.toLowerCase()

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${styles[key] || styles.inactif}`}>
      {['actif', 'valide'].includes(key) && (
        <CheckCircle2 size={13} strokeWidth={2.5} aria-hidden="true" />
      )}
      {labels[key] || status}
    </span>
  )
}