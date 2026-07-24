const styles = {
  actif: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  inactif: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  en_attente: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  valide: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  rejete: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  en_attente_modification: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
}

const labels = {
  actif: 'Actif',
  inactif: 'Inactif',
  en_attente: 'En attente',
  valide: 'Valide',
  rejete: 'Rejete',
  en_attente_modification: 'En attente de modification',
}

export default function StatusBadge({ status }) {
  const key = status?.toLowerCase()

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold shadow-sm ${styles[key] || styles.inactif}`}>
      {labels[key] || status}
    </span>
  )
}
