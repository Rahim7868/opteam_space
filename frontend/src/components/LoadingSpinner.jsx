export default function LoadingSpinner({ message = 'Chargement...' }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 text-slate-400">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
      <span className="text-sm">{message}</span>
    </div>
  )
}