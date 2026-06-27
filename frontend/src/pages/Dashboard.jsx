import { Building2, ClipboardList, Clock, Users, XCircle, CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import api from '../api/client'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
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
function FixingRow({ fixing }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-100 px-4 py-3 transition hover:bg-slate-50">
      <div>
        <div className="font-semibold text-slate-800">
          {fixing.devise}{' '}
          <span className="text-slate-500">—</span>{' '}
          {Number(fixing.cours).toFixed(4)}
        </div>
        <div className="mt-0.5 text-xs text-slate-400">
          {fixing.date_fixing}
          {fixing.createur && (
            <span className="ml-2 text-slate-400">
              · {fixing.createur.nom}
            </span>
          )}
        </div>
      </div>
      <StatusBadge status={fixing.statut} />
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
  const [stats, setStats]       = useState({})
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data }) => setStats(data ?? {}))
      .finally(() => setLoading(false))
  }, [])

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
    hasPermission('gerer_acteurs') && {
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
                <FixingRow key={fixing.id} fixing={fixing} />
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
      {hasPermission('gerer_acteurs') && (
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
    </>
  )
}
