import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function DataTable({ columns, rows, meta, onPage, loading }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-4 py-3">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              // Skeleton de chargement
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-12 text-center text-slate-400"
                  colSpan={columns.length}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">📭</span>
                    <span>Aucun résultat.</span>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-slate-50"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="whitespace-nowrap px-4 py-3 text-slate-700"
                    >
                      {col.render
                        ? col.render(row)
                        : (row[col.key] != null && row[col.key] !== '')
                          ? row[col.key]
                          : <span className="text-slate-400">N/A</span>}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          <span>
            <span className="font-medium text-slate-700">{meta.total ?? 0}</span> résultat{(meta.total ?? 0) > 1 ? 's' : ''} —
            page <span className="font-medium text-slate-700">{meta.current_page ?? 1}</span> sur{' '}
            <span className="font-medium text-slate-700">{meta.last_page ?? 1}</span>
          </span>

          <div className="flex gap-1">
            <button
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={(meta.current_page ?? 1) <= 1}
              onClick={() => onPage(meta.current_page - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={(meta.current_page ?? 1) >= (meta.last_page ?? 1)}
              onClick={() => onPage(meta.current_page + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}