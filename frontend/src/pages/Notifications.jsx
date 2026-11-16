import { Bell, CheckCheck, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import api, { getApiError } from '../api/client'
import ErrorAlert from '../components/ErrorAlert'
import NotificationRow from '../components/NotificationRow'
import PageHeader from '../components/PageHeader'
import { useNavigate } from 'react-router-dom'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [meta, setMeta] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [filter, setFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const loadNotifications = useCallback(async (page = 1) => {
    setIsLoading(true)
    setError('')
    try {
      const { data } = await api.get('/notifications', {
        params: {
          page,
          per_page: 15,
          unread: filter === 'unread' ? 1 : undefined,
        },
      })
      setNotifications(data.data)
      setMeta(data.meta)
      setUnreadCount(data.unread_count)
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  useEffect(() => {
    const timer = window.setTimeout(loadNotifications, 0)
    return () => window.clearTimeout(timer)
  }, [loadNotifications])

  async function openNotification(notification) {
    try {
      if (!notification.read_at) {
        await api.patch(`/notifications/${notification.id}/read`)
        setNotifications((current) => current.map((item) =>
          item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item
        ))
        setUnreadCount((count) => Math.max(0, count - 1))
      }

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
      setUnreadCount(0)
      if (filter === 'unread') {
        await loadNotifications(1)
      } else {
        const readAt = new Date().toISOString()
        setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? readAt })))
      }
    } catch (requestError) {
      setError(getApiError(requestError))
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Notifications"
        subtitle="Retrouvez les validations et décisions qui vous concernent."
        action={
          unreadCount > 0 && (
            <button type="button" className="btn btn-secondary" onClick={markAllRead}>
              <CheckCheck size={16} />
              Tout marquer comme lu
            </button>
          )
        }
      />

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Bell size={17} className="text-indigo-700" />
            {unreadCount ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Aucune notification non lue'}
          </div>
          <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1">
            {[
              { value: 'all', label: 'Toutes' },
              { value: 'unread', label: 'Non lues' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  filter === option.value
                    ? 'bg-white text-indigo-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <span className="h-7 w-7 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-700" />
          </div>
        ) : notifications.length ? (
          <>
            <div className="divide-y divide-slate-100">
              {notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onOpen={openNotification}
                />
              ))}
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {meta?.total ?? 0} notification{meta?.total === 1 ? '' : 's'} — page {meta?.current_page ?? 1} sur {meta?.last_page ?? 1}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Page précédente"
                  className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={(meta?.current_page ?? 1) <= 1}
                  onClick={() => loadNotifications(meta.current_page - 1)}
                >
                  <ChevronLeft size={17} />
                </button>
                <button
                  type="button"
                  aria-label="Page suivante"
                  className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={(meta?.current_page ?? 1) >= (meta?.last_page ?? 1)}
                  onClick={() => loadNotifications(meta.current_page + 1)}
                >
                  <ChevronRight size={17} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="px-5 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Inbox size={25} />
            </span>
            <h2 className="mt-4 text-base font-bold text-slate-800">
              {filter === 'unread' ? 'Tout est lu' : 'Aucune notification pour le moment'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Les demandes et décisions importantes apparaîtront ici.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
