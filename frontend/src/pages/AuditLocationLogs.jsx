import AuditLogTable from '../components/AuditLogTable'

export default function AuditLocationLogs() {
  return (
    <AuditLogTable
      category="locations"
      title="Locaux"
      subtitle="Historique des opérations liées aux agences, directions, départements et services."
      actionPlaceholder="Filtrer par action liée aux locaux"
      entityPlaceholder="Filtrer par entité (Agence, Direction, Departement, Service...)"
    />
  )
}
