const styles = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  inactive: 'bg-slate-100 text-slate-600 ring-slate-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-200',

}

const labels = {
  active: 'Actif',
  inactive: 'Inactif',
  pending: 'En attente',
  approved: 'Approuve',
  rejected: 'Refuse',
  
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ${styles[status] || styles.inactive}`}>
      {labels[status] || status}
    </span>
  )
}
