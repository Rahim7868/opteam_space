import { useEffect } from 'react'

export default function ErrorAlert({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return undefined

    const timer = setTimeout(() => {
      onDismiss?.()
    }, 5000)

    return () => clearTimeout(timer)
  }, [message, onDismiss])

  if (!message) return null

  return (
    <div className="animate-enter mb-4 rounded-2xl border border-rose-200 bg-rose-50/95 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
      {message}
    </div>
  )
}
