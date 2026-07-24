export default function LoadingSpinner({ message = 'Chargement...' }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-slate-400">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-teal-700 shadow-sm" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
}
