import { AlertTriangle, RefreshCw, ScrollText } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getApiError } from '../api/client'
import ErrorAlert from '../components/ErrorAlert'
import PageHeader from '../components/PageHeader'

const LEVEL_STYLES = {
  emergency: 'bg-rose-100 text-rose-800 ring-rose-200',
  alert: 'bg-rose-100 text-rose-800 ring-rose-200',
  critical: 'bg-rose-100 text-rose-800 ring-rose-200',
  error: 'bg-rose-50 text-rose-700 ring-rose-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  notice: 'bg-blue-50 text-blue-700 ring-blue-200',
  info: 'bg-teal-50 text-teal-700 ring-teal-200',
  debug: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export default function TechnicalLogs() {
  const [entries, setEntries] = useState([])
  const [level, setLevel] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)

  useEffect(() => {
    let active = true
    api.get('/technical-logs', {
      params: { limit: 50, ...(level ? { level } : {}) },
    })
      .then(({ data }) => {
        if (active) setEntries(data.data ?? [])
      })
      .catch((requestError) => {
        if (active) setError(getApiError(requestError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [level, refreshVersion])

  return (
    <>
      <PageHeader
        title="Journaux techniques"
        subtitle="Erreurs et événements récents du fonctionnement de l’application."
      />

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Consultation en lecture seule des 50 dernières entrées.
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="technical-log-level" className="text-sm font-medium text-slate-600">
            Niveau
          </label>
          <select
            id="technical-log-level"
            className="field min-w-36"
            value={level}
            onChange={(event) => {
              setError('')
              setLoading(true)
              setLevel(event.target.value)
            }}
          >
            <option value="">Tous les niveaux</option>
            <option value="emergency">Urgence</option>
            <option value="alert">Alerte</option>
            <option value="critical">Critique</option>
            <option value="error">Erreur</option>
            <option value="warning">Avertissement</option>
            <option value="notice">Notification</option>
            <option value="info">Information</option>
            <option value="debug">Diagnostic</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setError('')
              setLoading(true)
              setRefreshVersion((version) => version + 1)
            }}
            disabled={loading}
            className="btn btn-secondary"
            aria-label="Actualiser les journaux techniques"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-16 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <ScrollText size={32} className="text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">Aucune entrée à afficher</p>
            <p className="mt-1 text-sm text-slate-500">
              Aucun journal ne correspond au niveau sélectionné.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map((entry, index) => (
              <article key={`${entry.timestamp}-${index}`} className="flex gap-3 px-4 py-4 sm:px-5">
                <AlertTriangle
                  size={18}
                  className="mt-0.5 shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${LEVEL_STYLES[entry.level] ?? LEVEL_STYLES.info}`}>
                      {entry.level}
                    </span>
                    <time className="text-xs text-slate-500">{entry.timestamp}</time>
                  </div>
                  <p className="mt-2 break-words text-sm text-slate-800">{entry.message}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Les messages sont limités et les informations sensibles courantes sont masquées.
      </p>
    </>
  )
}
