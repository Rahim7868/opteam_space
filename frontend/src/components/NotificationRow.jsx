import { BellRing, Check, X } from 'lucide-react'

function formatNotificationDate(value) {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export default function NotificationRow({ notification, onOpen, compact = false }) {
  const isUnread = !notification.read_at

  return (
    <button
      type="button"
      onClick={() => onOpen(notification)}
      className={`flex w-full items-start gap-3 text-left transition ${
        compact
          ? 'rounded-xl px-3 py-3 hover:bg-slate-50'
          : 'px-4 py-4 hover:bg-indigo-50/50 sm:px-5'
      } ${isUnread ? 'bg-indigo-50/55' : 'bg-white'}`}
    >
      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
        notification.event?.includes('rejected')
          ? 'bg-rose-100 text-rose-700'
          : notification.event?.includes('approved')
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-indigo-100 text-indigo-700'
      }`}>
        {notification.event?.includes('rejected')
          ? <X size={17} />
          : notification.event?.includes('approved')
            ? <Check size={17} />
            : <BellRing size={17} />
        }
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="line-clamp-1 text-sm font-bold text-slate-800">
            {notification.title}
          </span>
          {isUnread && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" aria-label="Non lue" />
          )}
        </span>
        <span className={`mt-1 block text-slate-600 ${compact ? 'line-clamp-2 text-xs leading-relaxed' : 'text-sm leading-relaxed'}`}>
          {notification.message}
        </span>
        <span className="mt-1.5 block text-[11px] font-medium text-slate-400">
          {formatNotificationDate(notification.created_at)}
        </span>
      </span>
    </button>
  )
}
