const styles = {
  // Compte utilisateur
  actif:    'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  inactif:  'bg-slate-100 text-slate-600 ring-1 ring-slate-200',

  // Fixing / Bureau de change
  en_attente: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  valide:     'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  rejete:     'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
}

const labels = {
  actif:      'Actif',
  inactif:    'Inactif',
  en_attente: 'En attente',
  valide:     'Validé',
  rejete:     'Rejeté',
}

export default function StatusBadge({ status }) {
  const key = status?.toLowerCase()
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[key] || styles.inactif}`}>
      {labels[key] || status}
    </span>
  )
}