import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function DataTable({ columns, rows, meta, onPage }) {
  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="whitespace-nowrap px-4 py-3">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={columns.length}>
                  Aucun resultat.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  {columns.map((column) => (
                    <td key={column.key} className="whitespace-nowrap px-4 py-3 text-slate-700">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {meta && (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
          <span>
            Page {meta.current_page || 1} / {meta.last_page || 1}
          </span>
          <div className="flex gap-2">
            <button className="btn btn-secondary px-2" disabled={(meta.current_page || 1) <= 1} onClick={() => onPage(meta.current_page - 1)}>
              <ChevronLeft size={16} />
            </button>
            <button
              className="btn btn-secondary px-2"
              disabled={(meta.current_page || 1) >= (meta.last_page || 1)}
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
