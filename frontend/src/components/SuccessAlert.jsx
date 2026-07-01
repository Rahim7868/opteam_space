import { useEffect } from 'react'

export default function SuccessAlert({ message, onDismiss }) {
  useEffect(() => {
    if (!message) return undefined

    const timer = setTimeout(() => {
      onDismiss?.()
    }, 3000)

    return () => clearTimeout(timer)
  }, [message, onDismiss])

  if (!message) return null

  return (
    <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
      {message}
    </div>
  )
}
