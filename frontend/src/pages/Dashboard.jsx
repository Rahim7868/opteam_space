import { Building2, Check, CheckCircle, ClipboardList, Clock, Edit, Eye, MessageSquare, Users, X, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getApiError } from '../api/client'
import ConfirmModal from '../components/ConfirmModal'
import DetailModal, { formatDate, formatDateOnly } from '../components/DetailModal'
import ErrorAlert from '../components/ErrorAlert'
import IconActionButton from '../components/IconActionButton'
import ModificationReviewModal, { FIXING_FIELD_LABELS } from '../components/ModificationReviewModal'
import PageHeader from '../components/PageHeader'
import { RejectReasonModal, ViewReasonModal } from '../components/RejectReasonModal'
import StatusBadge from '../components/StatusBadge'
import SuccessAlert from '../components/SuccessAlert'
import { useAuth } from '../context/AuthContext'

// ── Carte stat ─────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, loading }) {
  const colors = {
    blue:   'bg-blue-500',
    amber:  'bg-amber-500',
    emerald:'bg-emerald-500',
    rose:   'bg-rose-500',
    indigo: 'bg-indigo-500',
    violet: 'bg-violet-500',
  }

  return (
    <div className={`${colors[color]} rounded-xl p-5 text-white shadow-sm`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white/80">{label}</span>
        <Icon size={20} className="text-white/60" />
      </div>
      {loading ? (
        <div className="mt-3 h-9 w-16 animate-pulse rounded-lg bg-white/20" />
      ) : (
        <div className="mt-2 text-3xl font-black">{value ?? 0}</div>
      )}
    </div>
  )
}

// ── Ligne fixing récent ────────────────────────────────────────
function FixingRow({
  fixing,
  userId,
  isAdmin,
  canModify,
  canValidate,
  canReject,
  canApproveModification,
  onView,
  onViewModifications,
  onEdit,
  onValidate,
  onReject,
  onViewReason,
}) {
  const modificationPending = fixing.statut_modification === 'en_attente_validation_modification'
  const canEdit = canModify
    && ['en_attente', 'rejete'].includes(fixing.statut)
    && (isAdmin || fixing.createur?.id === userId)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3 transition hover:bg-slate-50">
      <div className="min-w-0">
        <div className="font-semibold text-slate-800">
          {fixing.devise}{' '}
          <span className="text-slate-500">—</span>{' '}
          {Number(fixing.cours).toFixed(4)}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <span>{formatDateOnly(fixing.date_fixing)}</span>
          {fixing.createur && (
            <span>· {fixing.createur.nom}</span>
          )}
          <StatusBadge status={modificationPending ? 'en_attente_validation_modification' : fixing.statut} />
          {fixing.statut === 'rejete' && fixing.commentaire && (
            <IconActionButton
              icon={MessageSquare}
              label="Voir le motif du rejet"
              tone="danger"
              className="h-7 w-7"
              onClick={() => onViewReason(fixing.commentaire)}
            />
          )}
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        {modificationPending && canApproveModification ? (
          <IconActionButton
            icon={Eye}
            label="Voir les modifications"
            tone="info"
            onClick={() => onViewModifications(fixing)}
          />
        ) : (
          <IconActionButton
            icon={Eye}
            label="Voir les détails"
            onClick={() => onView(fixing)}
          />
        )}
        {canEdit && (
          <IconActionButton
            icon={Edit}
            label="Modifier"
            onClick={() => onEdit(fixing)}
          />
        )}
        {canValidate && fixing.statut === 'en_attente' && (
          <IconActionButton
            icon={Check}
            label="Valider"
            tone="success"
            onClick={() => onValidate(fixing.id)}
          />
        )}
        {canReject && fixing.statut === 'en_attente' && (
          <IconActionButton
            icon={X}
            label="Rejeter"
            tone="danger"
            onClick={() => onReject(fixing.id)}
          />
        )}
      </div>
    </div>
  )
}

// ── Skeleton liste ─────────────────────────────────────────────
function ListSkeleton({ rows = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
          </div>
          <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────
export default function Dashboard() {
  const { user, hasPermission } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats]       = useState({})
  const [loading, setLoading]   = useState(true)
  const [reloadVersion, setReloadVersion] = useState(0)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [detailModal, setDetailModal] = useState({ open: false, item: null })
  const [reviewModal, setReviewModal] = useState({ open: false, item: null })
  const [validateConfirm, setValidateConfirm] = useState({ open: false, id: null })
  const [rejectConfirm, setRejectConfirm] = useState({ open: false, id: null })
  const [viewReasonModal, setViewReasonModal] = useState({ open: false, reason: '' })

  useEffect(() => {
    let active = true
    api.get('/dashboard')
      .then(({ data }) => {
        if (active) setStats(data ?? {})
      })
      .catch((requestError) => {
        if (active) setError(getApiError(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [reloadVersion])

  const canModify = hasPermission('modifier_fixing')
  const canValidate = hasPermission('valider_fixing')
  const canReject = hasPermission('rejeter_fixing')
  const canApproveModification = hasPermission('approuver_modification_fixing')
  const isAdmin = user?.role?.libelle === 'Admin'
    || (hasPermission('creer_acteurs') && hasPermission('modifier_acteurs'))

  async function performFixingAction(id, action, payload, successMessage) {
    setError('')
    setSuccess('')

    try {
      const { data } = await api.post(`/fixings/${id}/${action}`, payload ?? {})
      setSuccess(data?.message || successMessage)
      setLoading(true)
      setReloadVersion((version) => version + 1)
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }

  // Cartes toujours visibles
  const baseCards = [
    {
      key: 'fixings_total',
      label: 'Fixings total',
      icon: ClipboardList,
      color: 'blue',
    },
    {
      key: 'fixings_en_attente',
      label: 'En attente',
      icon: Clock,
      color: 'amber',
    },
    {
      key: 'fixings_valides',
      label: 'Validés',
      icon: CheckCircle,
      color: 'emerald',
    },
    {
      key: 'fixings_rejetes',
      label: 'Rejetés',
      icon: XCircle,
      color: 'rose',
    },
  ]

  // Cartes conditionnelles selon permissions
  const extraCards = [
    hasPermission('modifier_acteurs') && {
      key: 'acteurs_total',
      label: 'Acteurs',
      icon: Users,
      color: 'indigo',
    },
    hasPermission('valider_bureau_change') && {
      key: 'bureaux_total',
      label: 'Bureaux de change',
      icon: Building2,
      color: 'violet',
    },
  ].filter(Boolean)

  const cards = [...baseCards, ...extraCards]

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        subtitle={`Bienvenue, ${user?.nom ?? ''}. Vue rapide de l'activité.`}
      />
      <ErrorAlert message={error} onDismiss={() => setError('')} />
      <SuccessAlert message={success} onDismiss={() => setSuccess('')} />

      {/* ── Cartes stats ──────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={stats[card.key]}
            icon={card.icon}
            color={card.color}
            loading={loading}
          />
        ))}
      </div>

      {/* ── Grille inférieure ─────────────────────────────── */}
      <div className={`mt-6 grid gap-6 ${
        hasPermission('valider_bureau_change') ? 'lg:grid-cols-2' : 'lg:grid-cols-1'
      }`}>

        {/* Fixings récents */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-950">
            Fixings récents
          </h2>
          {loading ? (
            <ListSkeleton />
          ) : (stats.recent_fixings ?? []).length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Aucun fixing pour le moment.
            </p>
          ) : (
            <div className="space-y-2">
              {stats.recent_fixings.map((fixing) => (
                <FixingRow
                  key={fixing.id}
                  fixing={fixing}
                  userId={user?.id}
                  isAdmin={isAdmin}
                  canModify={canModify}
                  canValidate={canValidate}
                  canReject={canReject}
                  canApproveModification={canApproveModification}
                  onView={(item) => setDetailModal({ open: true, item })}
                  onViewModifications={(item) => setReviewModal({ open: true, item })}
                  onEdit={(item) => navigate('/fixings', { state: { editFixing: item } })}
                  onValidate={(id) => setValidateConfirm({ open: true, id })}
                  onReject={(id) => setRejectConfirm({ open: true, id })}
                  onViewReason={(reason) => setViewReasonModal({ open: true, reason })}
                />
              ))}
            </div>
          )}
        </div>

        {/* Bureaux de change récents (si permission) */}
        {hasPermission('valider_bureau_change') && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-bold text-slate-950">
              Bureaux de change récents
            </h2>

            {/* Stats rapides bureaux */}
            <div className="mb-4 grid grid-cols-3 gap-3">
              {[
                { key: 'bureaux_en_attente', label: 'En attente', color: 'text-amber-600 bg-amber-50' },
                { key: 'bureaux_valides',    label: 'Validés',    color: 'text-emerald-600 bg-emerald-50' },
                { key: 'bureaux_rejetes',    label: 'Rejetés',    color: 'text-rose-600 bg-rose-50' },
              ].map(({ key, label, color }) => (
                <div key={key} className={`rounded-lg p-3 text-center ${color}`}>
                  {loading ? (
                    <div className="mx-auto h-6 w-8 animate-pulse rounded bg-current opacity-20" />
                  ) : (
                    <div className="text-xl font-black">{stats[key] ?? 0}</div>
                  )}
                  <div className="mt-1 text-xs font-medium">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── Audit logs récents (si permission) ────────────── */}
      {hasPermission('modifier_acteurs') && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-slate-950">
            Activité récente
          </h2>
          {loading ? (
            <ListSkeleton rows={3} />
          ) : (stats.recent_audit_logs ?? []).length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">
              Aucune activité récente.
            </p>
          ) : (
            <div className="space-y-2">
              {stats.recent_audit_logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-800">
                      {log.description}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {log.user?.nom ?? 'Système'}
                    </div>
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(log.created_at).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={validateConfirm.open}
        title="Confirmer la validation ?"
        message="Le fixing sera marqué comme validé."
        confirmText="Valider"
        onConfirm={async () => {
          const id = validateConfirm.id
          setValidateConfirm({ open: false, id: null })
          if (id) await performFixingAction(id, 'valider', null, 'Fixing validé.')
        }}
        onCancel={() => setValidateConfirm({ open: false, id: null })}
      />

      <RejectReasonModal
        open={rejectConfirm.open}
        title="Rejeter ce fixing"
        message="Indique le motif du rejet."
        onConfirm={async (commentaire) => {
          const id = rejectConfirm.id
          setRejectConfirm({ open: false, id: null })
          if (id) {
            await performFixingAction(
              id,
              'rejeter',
              { commentaire },
              'Fixing rejeté.'
            )
          }
        }}
        onCancel={() => setRejectConfirm({ open: false, id: null })}
      />

      <ModificationReviewModal
        open={reviewModal.open}
        item={reviewModal.item}
        fieldLabels={FIXING_FIELD_LABELS}
        onConfirm={async () => {
          const id = reviewModal.item?.id
          setReviewModal({ open: false, item: null })
          if (id) {
            await performFixingAction(
              id,
              'approuver-modification',
              null,
              'Modifications appliquées définitivement.'
            )
          }
        }}
        onReject={async () => {
          const id = reviewModal.item?.id
          setReviewModal({ open: false, item: null })
          if (id) {
            await performFixingAction(
              id,
              'rejeter-modification',
              null,
              'Modifications rejetées. Les données restent inchangées.'
            )
          }
        }}
        onClose={() => setReviewModal({ open: false, item: null })}
      />

      <ViewReasonModal
        open={viewReasonModal.open}
        title="Motif du rejet du fixing"
        reason={viewReasonModal.reason}
        onClose={() => setViewReasonModal({ open: false, reason: '' })}
      />

      <DetailModal
        open={detailModal.open}
        onClose={() => setDetailModal({ open: false, item: null })}
        title={detailModal.item
          ? `${detailModal.item.devise} — ${formatDateOnly(detailModal.item.date_fixing)}`
          : 'Fixing'}
        fields={detailModal.item ? [
          { label: 'Date du fixing', value: formatDateOnly(detailModal.item.date_fixing) },
          { label: 'Devise', value: detailModal.item.devise },
          { label: 'Cours', value: Number(detailModal.item.cours).toLocaleString('fr-FR', { maximumFractionDigits: 6 }) },
          {
            label: 'Variation',
            value: detailModal.item.variation != null
              ? `${Number(detailModal.item.variation) > 0 ? '+' : ''}${Number(detailModal.item.variation).toLocaleString('fr-FR', { maximumFractionDigits: 6 })}`
              : '—',
          },
          { label: 'Créateur', value: detailModal.item.createur?.nom ?? '—' },
          { label: 'Statut', value: <StatusBadge status={detailModal.item.statut} /> },
          ...(detailModal.item.statut === 'valide'
            ? [{ label: 'Validé par', value: detailModal.item.validateur?.nom ?? '—' }]
            : []),
          ...(detailModal.item.statut === 'rejete'
            ? [{ label: 'Refusé par', value: detailModal.item.validateur?.nom ?? '—' }]
            : []),
          ...(detailModal.item.statut === 'rejete' && detailModal.item.commentaire
            ? [{ label: 'Motif de rejet', value: detailModal.item.commentaire }]
            : []),
          {
            label: 'Pièce jointe',
            value: detailModal.item.piece_jointe_url ? (
              <a
                href={detailModal.item.piece_jointe_url}
                target="_blank"
                rel="noreferrer"
                className="text-teal-600 hover:underline text-xs font-semibold"
              >
                Voir la pièce jointe
              </a>
            ) : '—',
          },
          { label: 'Créé le', value: formatDate(detailModal.item.created_at) },
          { label: 'Mis à jour le', value: formatDate(detailModal.item.updated_at) },
        ] : []}
        footer={
          detailModal.item?.statut_modification !== 'en_attente_validation_modification'
          && detailModal.item
          && (
            <>
              {canValidate && detailModal.item.statut === 'en_attente' && (
                <IconActionButton
                  icon={Check}
                  label="Valider"
                  tone="success"
                  onClick={() => {
                    const id = detailModal.item.id
                    setDetailModal({ open: false, item: null })
                    setValidateConfirm({ open: true, id })
                  }}
                />
              )}
              {canReject && detailModal.item.statut === 'en_attente' && (
                <IconActionButton
                  icon={X}
                  label="Rejeter"
                  tone="danger"
                  onClick={() => {
                    const id = detailModal.item.id
                    setDetailModal({ open: false, item: null })
                    setRejectConfirm({ open: true, id })
                  }}
                />
              )}
              {canModify
                && ['en_attente', 'rejete'].includes(detailModal.item.statut)
                && (isAdmin || detailModal.item.createur?.id === user?.id) && (
                  <IconActionButton
                    icon={Edit}
                    label="Modifier"
                    onClick={() => {
                      const item = detailModal.item
                      setDetailModal({ open: false, item: null })
                      navigate('/fixings', { state: { editFixing: item } })
                    }}
                  />
                )}
            </>
          )
        }
      />
    </>
  )
}