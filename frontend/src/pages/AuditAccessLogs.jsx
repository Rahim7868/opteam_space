import AuditLogTable from '../components/AuditLogTable'

export default function AuditAccessLogs() {
  return (
    <AuditLogTable
      category="access-control"
      title="Utilisateurs, rôles et permissions"
      subtitle="Historique des opérations liées aux acteurs, rôles, permissions et affectations."
      actionPlaceholder="Filtrer par action (ex: user_created, permissions_updated...)"
      entityPlaceholder="Filtrer par entité (User, Role, Permission...)"
    />
  )
}
