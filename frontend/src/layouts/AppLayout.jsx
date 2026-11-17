import {
  Building2,
  ChevronDown,
  ClipboardList,
  Gauge,
  History,
  LogOut,
  Mail,
  Menu,
  Network,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from '../components/NotificationBell'
import sfciLogo from '../assets/Sfcibanklogo.png'

export default function AppLayout() {
  const { user, logout, hasPermission } = useAuth()
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [structureOpen, setStructureOpen] = useState(false)
  const [acteursOpen, setActeursOpen]     = useState(false)
  const [historyOpen, setHistoryOpen]      = useState(false)

  // ── Liens dynamiques selon les permissions ─────────────────
  const mainLinks = [  
    {
      to: '/',
      label: 'Tableau de bord',
      icon: Gauge,
      always: true,
    },
    {
      to: '/fixings',
      label: 'Fixings',
      icon: ClipboardList,
      show: [
        'creer_fixing',
        'modifier_fixing',
        'valider_fixing',
        'rejeter_fixing',
        'consulter_fixing',
        'approuver_modification_fixing',
      ].some((permission) => hasPermission(permission)),
    },
    {
      to: '/bureau-changes',
      label: 'Bureaux de change',
      icon: Building2,
      show: [
        'creer_bureau_change',
        'valider_bureau_change',
        'consulter_bureau_change',
        'approuver_modification_bureau',
      ].some((permission) => hasPermission(permission)),
    },
    {
      to: '/report-recipients',
      label: 'Rapports',
      icon: Mail,
      show: hasPermission('gerer_rapports'),
    },
  ].filter((l) => l.always || l.show)

  // 🔥 ACTEURS : remplacer 'gerer_acteurs' par les nouvelles permissions
  const acteursLinks = [
    { to: '/users',       label: 'Utilisateurs', permission: 'modifier_acteurs' },
    { to: '/roles',       label: 'Rôles',        permission: 'gerer_roles' },
    { to: '/permissions', label: 'Permissions',  permission: 'gerer_permissions' },
  ].filter((l) => hasPermission(l.permission))

  const structureLinks = [
    { to: '/agences',      label: 'Agences',      permission: 'gerer_agences' },
    { to: '/directions',   label: 'Directions',   permission: 'gerer_directions' },
    { to: '/departements', label: 'Départements', permission: 'gerer_departements' },
    { to: '/services',     label: 'Services',     permission: 'gerer_services' },
  ].filter((l) => hasPermission(l.permission))

  const historyLinks = [
    { to: '/audit-logs/actions', label: 'Actions des utilisateurs' },
    { to: '/audit-logs/fixings-bureaux', label: 'Fixings et bureaux de change' },
    { to: '/audit-logs/locaux', label: 'Locaux' },
    { to: '/audit-logs/acces', label: 'Utilisateurs, rôles et permissions' },
  ]

  const showAudit     = hasPermission('consulter_audits')
  const showActeurs   = acteursLinks.length > 0
  const showStructure = structureLinks.length > 0

  return (
    <div className="min-h-screen bg-slate-100">
      {sidebarOpen && (
        <div
          className="fixed inset-x-0 bottom-0 top-16 z-30 bg-slate-950/45 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 shadow-sm sm:px-6 lg:px-7">
        <div className="flex min-w-0 flex-1 items-center">
          <div className="flex shrink-0 items-center gap-2 lg:w-56">
            <img
              src={sfciLogo}
              alt="SFCI BANK"
              className="h-9 w-auto max-w-28 object-contain sm:max-w-none"
            />
            <button
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
            >
              <Menu size={20} />
            </button>
          </div>
          <h1 className="truncate text-lg font-extrabold tracking-tight text-teal-800 sm:text-2xl lg:text-[1.7rem]">
            Bienvenue, {user?.nom?.split(/\s+/)[0] ?? 'Utilisateur'} !
          </h1>
        </div>
        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <NotificationBell />
          <NavLink
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            aria-label={`Ouvrir le profil de ${user?.nom ?? 'l’utilisateur'}`}
            title="Mon profil"
            className={({ isActive }) =>
              `flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-teal-50 text-sm font-bold text-teal-800 transition hover:scale-105 hover:bg-teal-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${
                isActive ? 'border-teal-700 ring-2 ring-teal-100' : 'border-teal-500'
              }`
            }
          >
            {user?.nom?.charAt(0)?.toUpperCase() ?? '?'}
          </NavLink>
          <div className="hidden min-w-0 text-left sm:block">
            <div className="max-w-40 truncate text-sm font-bold text-slate-800">
              {user?.nom ?? 'Utilisateur'}
            </div>
            <div className="max-w-40 truncate text-[11px] text-slate-500">
              {user?.email}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-rose-600 sm:px-3"
              onClick={logout}
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <aside
        className={`fixed inset-y-16 left-0 z-40 flex w-56 flex-col border-r border-slate-200 bg-white shadow-lg shadow-slate-900/5 transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex-1 space-y-1 overflow-y-auto p-2 sm:p-3">
          {mainLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-center text-xs font-semibold transition-all duration-200 sm:text-[13px] ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-teal-800'
                }`
              }
            >
              <Icon size={21} />
              {label}
            </NavLink>
          ))}

          {showActeurs && (
            <div className="pt-1">
              <button
                onClick={() => setActeursOpen(!acteursOpen)}
                className="relative flex min-h-[76px] w-full flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-center text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-teal-800 sm:text-[13px]"
              >
                <span className="flex flex-col items-center gap-1">
                  <Users size={21} />
                  Gestion des acteurs
                </span>
                <ChevronDown
                  size={16}
                  className={`absolute right-2 top-2 transition-transform ${acteursOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {acteursOpen && (
                <div className="mx-2 mt-1 space-y-1 border-l-2 border-teal-100 pl-2">
                  {acteursLinks.map(({ to, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `block rounded-md px-2 py-2 text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-teal-50 text-teal-800'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                        }`
                      }
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}

          {showStructure && (
            <div className="pt-1">
              <button
                onClick={() => setStructureOpen(!structureOpen)}
                className="relative flex min-h-[76px] w-full flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-center text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-teal-800 sm:text-[13px]"
              >
                <span className="flex flex-col items-center gap-1">
                  <Network size={21} />
                  Gestion des locaux
                </span>
                <ChevronDown
                  size={16}
                  className={`absolute right-2 top-2 transition-transform ${structureOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {structureOpen && (
                <div className="mx-2 mt-1 space-y-1 border-l-2 border-teal-100 pl-2">
                  {structureLinks.map(({ to, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `block rounded-md px-2 py-2 text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-teal-50 text-teal-800'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                        }`
                      }
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}

          {showAudit && (
            <div className="pt-1">
              <button
                onClick={() => setHistoryOpen(!historyOpen)}
                className="relative flex min-h-[76px] w-full flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-center text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-teal-800 sm:text-[13px]"
              >
                <span className="flex flex-col items-center gap-1">
                  <History size={21} />
                  Audits
                </span>
                <ChevronDown
                  size={16}
                  className={`absolute right-2 top-2 transition-transform ${historyOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {historyOpen && (
                <div className="mx-2 mt-1 space-y-1 border-l-2 border-teal-100 pl-2">
                  {historyLinks.map(({ to, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `block rounded-md px-2 py-2 text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-teal-50 text-teal-800'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                        }`
                      }
                    >
                      {label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          )}

        </nav>
      </aside>

      <div className="lg:pl-56">
        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-5 lg:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  )
}