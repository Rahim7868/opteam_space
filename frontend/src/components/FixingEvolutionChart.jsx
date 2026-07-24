import { Activity, CalendarDays, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import StatusBadge from './StatusBadge'

const periods = [
  { value: 'today', label: "Aujourd'hui" },
  { value: '7d', label: '7 derniers jours' },
  { value: 'month', label: 'Ce mois' },
  { value: 'year', label: 'Cette annee' },
  { value: 'custom', label: 'Personnalisee' },
]

function formatCourse(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A'

  return Number(value).toLocaleString('fr-FR', {
    maximumFractionDigits: 6,
  })
}

function formatVariation(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A'

  const number = Number(value)
  const sign = number > 0 ? '+' : ''

  return `${sign}${formatCourse(number)}`
}

function parseDate(value) {
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function isWithinPeriod(row, period, customFrom, customTo) {
  const date = parseDate(row.date_fixing)
  if (!date) return false

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (period === 'today') {
    return date.getTime() === today.getTime()
  }

  if (period === '7d') {
    const start = new Date(today)
    start.setDate(start.getDate() - 6)
    return date >= start && date <= today
  }

  if (period === 'month') {
    return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth()
  }

  if (period === 'year') {
    return date.getFullYear() === today.getFullYear()
  }

  if (period === 'custom') {
    const start = customFrom ? parseDate(customFrom) : null
    const end = customTo ? parseDate(customTo) : null
    return (!start || date >= start) && (!end || date <= end)
  }

  return true
}

function buildPath(points) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`

    const previous = points[index - 1]
    const controlX = previous.x + (point.x - previous.x) / 2

    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`
  }, '')
}

export default function FixingEvolutionChart({ fixings, loading }) {
  const currencies = useMemo(() => [...new Set(fixings.map((row) => row.devise).filter(Boolean))].sort(), [fixings])
  const [currency, setCurrency] = useState('')
  const [period, setPeriod] = useState('month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [hovered, setHovered] = useState(null)

  const selectedCurrency = currency || currencies[0] || ''

  const data = useMemo(() => {
    return fixings
      .filter((row) => row.devise === selectedCurrency)
      .filter((row) => isWithinPeriod(row, period, customFrom, customTo))
      .slice()
      .sort((a, b) => {
        const dateDiff = new Date(a.date_fixing) - new Date(b.date_fixing)
        return dateDiff || a.id - b.id
      })
  }, [customFrom, customTo, fixings, period, selectedCurrency])

  const chart = useMemo(() => {
    const width = 860
    const height = 280
    const padding = { top: 24, right: 28, bottom: 44, left: 54 }
    const values = data.map((row) => Number(row.cours)).filter((value) => !Number.isNaN(value))
    const min = values.length ? Math.min(...values) : 0
    const max = values.length ? Math.max(...values) : 0
    const range = max - min || 1

    const points = data.map((row, index) => {
      const x = data.length === 1
        ? width / 2
        : padding.left + (index * (width - padding.left - padding.right)) / (data.length - 1)
      const y = padding.top + ((max - Number(row.cours)) * (height - padding.top - padding.bottom)) / range

      return { ...row, x, y }
    })

    return {
      width,
      height,
      padding,
      points,
      min,
      max,
      path: buildPath(points),
      areaPath: points.length
        ? `${buildPath(points)} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`
        : '',
    }
  }, [data])

  const stats = useMemo(() => {
    const variations = data.map((row) => Number(row.variation)).filter((value) => !Number.isNaN(value))
    const last = data[data.length - 1]
    const first = data[0]

    return {
      lastCourse: last?.cours,
      total: data.length,
      strongestUp: variations.length ? Math.max(...variations) : null,
      strongestDown: variations.length ? Math.min(...variations) : null,
      cumulative: first && last ? Number(last.cours) - Number(first.cours) : null,
    }
  }, [data])

  return (
    <section className="panel animate-enter mt-6 overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
            <Activity size={15} />
            Analyse des cours
          </div>
          <h2 className="mt-2 text-xl font-black text-slate-950">Evolution des fixings</h2>
          <p className="mt-1 text-sm text-slate-500">
            Suivi chronologique des cours par devise, avec variation et tendance sur la periode.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[520px] lg:grid-cols-[150px_180px_1fr_1fr]">
          <select className="field" value={selectedCurrency} onChange={(event) => setCurrency(event.target.value)} disabled={!currencies.length}>
            {currencies.length ? currencies.map((item) => <option key={item}>{item}</option>) : <option>Aucune devise</option>}
          </select>

          <select className="field" value={period} onChange={(event) => setPeriod(event.target.value)}>
            {periods.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>

          {period === 'custom' && (
            <>
              <input className="field" type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
              <input className="field" type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
            </>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="panel-soft relative min-h-[330px] overflow-hidden p-4">
          {loading ? (
            <div className="flex h-[300px] items-center justify-center text-sm font-medium text-slate-400">
              Chargement de l'analyse...
            </div>
          ) : data.length === 0 ? (
            <div className="flex h-[300px] flex-col items-center justify-center text-center">
              <CalendarDays className="text-slate-300" size={34} />
              <p className="mt-3 font-semibold text-slate-700">Aucune donnee pour cette periode</p>
              <p className="mt-1 text-sm text-slate-400">Changez la devise ou elargissez la periode.</p>
            </div>
          ) : (
            <div className="relative">
              <svg className="h-[300px] w-full overflow-visible" viewBox={`0 0 ${chart.width} ${chart.height}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="fixingLine" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0%" stopColor="#0f766e" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                  <linearGradient id="fixingArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#0f766e" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {[0, 1, 2, 3].map((line) => {
                  const y = chart.padding.top + (line * (chart.height - chart.padding.top - chart.padding.bottom)) / 3
                  return <line key={line} x1={chart.padding.left} x2={chart.width - chart.padding.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 8" />
                })}

                {chart.areaPath && <path d={chart.areaPath} fill="url(#fixingArea)" />}
                {chart.path && (
                  <path
                    d={chart.path}
                    fill="none"
                    stroke="url(#fixingLine)"
                    strokeLinecap="round"
                    strokeWidth="4"
                    style={{ strokeDasharray: 1200, strokeDashoffset: 0, transition: 'stroke-dashoffset 700ms ease' }}
                  />
                )}

                {chart.points.map((point, index) => (
                  <g key={point.id}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={hovered?.id === point.id ? 7 : 5}
                      fill="#ffffff"
                      stroke={Number(point.variation) < 0 ? '#e11d48' : '#0f766e'}
                      strokeWidth="3"
                      className="cursor-pointer transition-all duration-150"
                      onMouseEnter={() => setHovered(point)}
                      onMouseLeave={() => setHovered(null)}
                    />
                    {(index === 0 || index === chart.points.length - 1) && (
                      <text x={point.x} y={chart.height - 14} textAnchor={index === 0 ? 'start' : 'end'} className="fill-slate-400 text-[11px] font-semibold">
                        {point.date_fixing}
                      </text>
                    )}
                  </g>
                ))}
              </svg>

              {hovered && (
                <div
                  className="pointer-events-none absolute z-10 w-64 rounded-2xl border border-slate-200 bg-white/95 p-4 text-sm shadow-2xl shadow-slate-950/15"
                  style={{
                    left: `${Math.min(78, Math.max(4, (hovered.x / chart.width) * 100))}%`,
                    top: `${Math.min(62, Math.max(4, (hovered.y / chart.height) * 100))}%`,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-slate-900">{hovered.devise}</span>
                    <StatusBadge status={hovered.statut} />
                  </div>
                  <dl className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between gap-4"><dt className="text-slate-400">Date</dt><dd className="font-semibold text-slate-700">{hovered.date_fixing}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-400">Cours</dt><dd className="font-semibold text-slate-900">{formatCourse(hovered.cours)}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-400">Variation</dt><dd className={Number(hovered.variation) < 0 ? 'font-semibold text-rose-600' : 'font-semibold text-emerald-700'}>{formatVariation(hovered.variation)}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-slate-400">Createur</dt><dd className="font-semibold text-slate-700">{hovered.createur?.nom || 'N/A'}</dd></div>
                  </dl>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Dernier cours', value: formatCourse(stats.lastCourse), icon: Activity, tone: 'text-slate-700' },
            { label: 'Total fixings', value: stats.total, icon: CalendarDays, tone: 'text-slate-700' },
            { label: 'Plus forte hausse', value: formatVariation(stats.strongestUp), icon: TrendingUp, tone: 'text-emerald-700' },
            { label: 'Plus forte baisse', value: formatVariation(stats.strongestDown), icon: TrendingDown, tone: 'text-rose-700' },
            { label: 'Variation cumulee', value: formatVariation(stats.cumulative), icon: Activity, tone: Number(stats.cumulative) < 0 ? 'text-rose-700' : 'text-emerald-700' },
          ].map(({ label, value, icon: Icon, tone }) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Icon size={14} />
                {label}
              </div>
              <div className={`mt-2 text-lg font-black ${tone}`}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
