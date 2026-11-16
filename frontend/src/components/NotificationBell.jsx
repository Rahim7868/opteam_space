import { Bell, CheckCheck, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import api, { getApiError } from '../api/client'
import ErrorAlert from './ErrorAlert'
import NotificationRow from './NotificationRow'

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [openedPath, setOpenedPath] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const isMenuOpen = isOpen && openedPath === location.pathname

  const refreshUnreadCount = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications/unread-count')
      setUnreadCount(data.count)
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const { data } = await api.get('/notifications', { params: { per_page: 8 } })
      setNotifications(data.data)
      setUnreadCount(data.unread_count)
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const initialTimer = window.setTimeout(refreshUnreadCount, 0)
    const interval = window.setInterval(refreshUnreadCount, 60_000)
    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(interval)
    }
  }, [refreshUnreadCount])

  async function openNotification(notification) {
    try {
      if (!notification.read_at) {
        await api.patch(`/notifications/${notification.id}/read`)
        setNotifications((current) => current.map((item) =>
          item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item
        ))
        setUnreadCount((count) => Math.max(0, count - 1))
      }

      setIsOpen(false)
      navigate(notification.url?.startsWith('/') && !notification.url.startsWith('//')
        ? notification.url
        : '/')
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }

  async function markAllRead() {
    try {
      await api.patch('/notifications/read-all')
      const readAt = new Date().toISOString()
      setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? readAt })))
      setUnreadCount(0)
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }

  function toggleOpen() {
    const nextOpen = !isMenuOpen
    setIsOpen(nextOpen)
    if (nextOpen) {
      setOpenedPath(location.pathname)
      loadNotifications()
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} non lues` : ''}`}
        aria-haspopup="dialog"
        aria-expanded={isMenuOpen}
        className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
          isMenuOpen
            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-indigo-700'
        }`}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-600 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isMenuOpen && (
        <section
          role="dialog"
          aria-label="Centre de notifications"
          className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/15"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Notifications</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {unreadCount ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50"
                >
                  <CheckCheck size={15} />
                  Tout lire
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fermer les notifications"
                title="Fermer"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          <ErrorAlert message={error} onDismiss={() => setError('')} />

          <div className="max-h-[min(26rem,65vh)] overflow-y-auto p-1.5">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-700" />
              </div>
            ) : notifications.length ? (
              notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onOpen={openNotification}
                  compact
                />
              ))
            ) : (
              <div className="px-4 py-10 text-center">
                <Bell size={22} className="mx-auto text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-700">Aucune notification</p>
                <p className="mt-1 text-xs text-slate-500">Les nouveautés importantes apparaîtront ici.</p>
              </div>
            )}
          </div>

          <Link
            to="/notifications"
            onClick={() => setIsOpen(false)}
            className="block border-t border-slate-100 px-4 py-3 text-center text-xs font-bold text-indigo-700 transition hover:bg-indigo-50"
          >
            Voir toutes les notifications
          </Link>
        </section>
      )}
    </div>
  )
}
