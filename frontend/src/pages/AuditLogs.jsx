import AuditLogTable from '../components/AuditLogTable'

export default function AuditLogs() {
  return (
    <AuditLogTable
      category="user-actions"
      title="Actions des utilisateurs"
      subtitle="Connexions, déconnexions et actions générales des utilisateurs."
      actionPlaceholder="Filtrer par action (ex: login, logout...)"
      entityPlaceholder="Filtrer par entité (ex: User, System...)"
    />
  )
}
