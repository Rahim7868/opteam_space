import { useEffect, useState } from 'react'
import api from '../api/client'
import PageHeader from '../components/PageHeader'
import StatusBadge from '../components/StatusBadge'
import { useAuth } from '../context/AuthContext'

const baseCards = [
  ['fixings_total', 'Fixings', 'bg-blue-500 text-white', 'text-blue-100'],
  ['fixings_pending', 'En attente', 'bg-amber-500 text-white', 'text-amber-100'],
  ['fixings_approved', 'Approuvés', 'bg-emerald-500 text-white', 'text-emerald-100'],
  ['fixings_rejected', 'Refusés', 'bg-red-500 text-white', 'text-red-100'],
]

const adminCards = [
  ['agents_total', 'Agents', 'bg-indigo-500 text-white', 'text-indigo-100'],
  ['bureaux_total', 'Bureaux', 'bg-violet-500 text-white', 'text-violet-100'],
]

export default function Dashboard() {
  const { isAdmin } = useAuth()
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard')
      .then(({ data }) => setStats(data || {}))
      .finally(() => setLoading(false))
  }, [])

  const cards = isAdmin
    ? [...baseCards, ...adminCards]
    : baseCards

  return (
    <>
      <PageHeader
        title={isAdmin ? 'Tableau de bord admin' : 'Tableau de bord agent'}
        subtitle="Vue rapide des fixings et validations."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([key, label, bgClass, labelClass]) => (
          <div
            key={key}
            className={`rounded-md shadow-sm p-5 ${bgClass}`}
          >
            <div className={`text-sm font-semibold ${labelClass}`}>
              {label}
            </div>

            <div className="mt-2 text-3xl font-black">
              {stats[key] ?? 0}
            </div>
          </div>
        ))}
      </div>

      <div className="panel mt-6 p-5">
        <h2 className="mb-4 text-lg font-bold text-slate-950">
          Fixings récents
        </h2>

        <div className="space-y-3">
          {(stats.recent_fixings ?? []).map((fixing) => (
            <div
              key={fixing.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-slate-100 px-4 py-3"
            >
              <div>
                <div className="font-semibold text-slate-800">
                  {fixing.devise} - {Number(fixing.cours).toFixed(4)}
                </div>

                <div className="text-sm text-slate-500">
                  {fixing.date_fixing}
                </div>
              </div>

              <StatusBadge status={fixing.status} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}