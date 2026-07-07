import AuditLogTable from '../components/AuditLogTable'

export default function AuditExchangeLogs() {
  return (
    <AuditLogTable
      category="exchange"
      title="Fixings et bureaux de change"
      subtitle="Historique des opérations liées aux fixings et aux bureaux de change."
      actionPlaceholder="Filtrer par action (ex: fixing_created, bureau_updated...)"
      entityPlaceholder="Filtrer par entité (Fixing, BureauChange...)"
    />
  )
}
