import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function DataTable({ columns, rows, meta, onPage, loading }) {
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50/90 text-left text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-5 py-4">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-5 py-4">
                      <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-100" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-5 py-14 text-center text-slate-400" colSpan={columns.length}>
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <span className="h-2 w-2 rounded-full bg-current" />
                    </div>
                    <span className="font-semibold text-slate-600">Aucun resultat</span>
                    <span className="text-xs text-slate-400">Ajustez les filtres ou ajoutez un nouvel element.</span>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="transition-colors duration-150 hover:bg-teal-50/30">
                  {columns.map((col) => (
                    <td key={col.key} className="whitespace-nowrap px-5 py-4 text-slate-700">
                      {col.render
                        ? col.render(row)
                        : row[col.key] != null && row[col.key] !== ''
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

      {meta && (
        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/80 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            <span className="font-medium text-slate-700">{meta.total ?? 0}</span> resultats -
            page <span className="font-medium text-slate-700">{meta.current_page ?? 1}</span> sur{' '}
            <span className="font-medium text-slate-700">{meta.last_page ?? 1}</span>
          </span>

          <div className="flex gap-1">
            <button
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={(meta.current_page ?? 1) <= 1}
              onClick={() => onPage(meta.current_page - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
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
