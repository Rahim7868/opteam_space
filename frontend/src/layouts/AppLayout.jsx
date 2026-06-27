import {
  Building2,
  ChevronDown,
  ClipboardList,
  Gauge,
  History,
  KeyRound,
  LogOut,
  Menu,
  Network,
  Shield,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AppLayout() {
  const { user, logout, hasPermission } = useAuth()
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [structureOpen, setStructureOpen] = useState(false)
  const [acteursOpen, setActeursOpen]     = useState(false)

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
      show: hasPermission('creer_fixing') || hasPermission('valider_fixing'),
    },
    {
      to: '/bureau-changes',
      label: 'Bureaux de change',
      icon: Building2,
      show: hasPermission('creer_bureau_change') || hasPermission('valider_bureau_change'),
    },
  ].filter((l) => l.always || l.show)

  const acteursLinks = [
    { to: '/users',       label: 'Utilisateurs', permission: 'gerer_acteurs' },
    { to: '/roles',       label: 'Rôles',        permission: 'gerer_roles' },
    { to: '/permissions', label: 'Permissions',  permission: 'gerer_permissions' },
  ].filter((l) => hasPermission(l.permission))

  const structureLinks = [
    { to: '/agences',      label: 'Agences',      permission: 'gerer_agences' },
    { to: '/directions',   label: 'Directions',   permission: 'gerer_directions' },
    { to: '/departements', label: 'Départements', permission: 'gerer_departements' },
    { to: '/services',     label: 'Services',     permission: 'gerer_services' },
  ].filter((l) => hasPermission(l.permission))

  const showAudit     = hasPermission('gerer_acteurs')
  const showActeurs   = acteursLinks.length > 0
  const showStructure = structureLinks.length > 0

  return (
    <div className="min-h-screen bg-slate-100">

      {/* ── Overlay mobile ────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">
          <div>
            <div className="text-lg font-black tracking-wide text-teal-800">
              OPTEAM_SPACE
            </div>
            <div className="text-xs font-medium uppercase text-slate-400">
              {user?.role?.libelle ?? 'Utilisateur'}
            </div>
          </div>
          <button
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">

          {/* Liens principaux */}
          {mainLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}

          {/* ── Gestion des acteurs (accordéon) ────────────── */}
          {showActeurs && (
            <div className="pt-2">
              <button
                onClick={() => setActeursOpen(!acteursOpen)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              >
                <span className="flex items-center gap-3">
                  <Users size={18} />
                  Gestion des acteurs
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${acteursOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {acteursOpen && (
                <div className="ml-6 mt-1 space-y-1 border-l border-slate-200 pl-3">
                  {acteursLinks.map(({ to, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `block rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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

          {/* ── Structure organisationnelle (accordéon) ──────── */}
          {showStructure && (
            <div className="pt-2">
              <button
                onClick={() => setStructureOpen(!structureOpen)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-950"
              >
                <span className="flex items-center gap-3">
                  <Network size={18} />
                  Gestion des locaux
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${structureOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {structureOpen && (
                <div className="ml-6 mt-1 space-y-1 border-l border-slate-200 pl-3">
                  {structureLinks.map(({ to, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `block rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
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

          {/* ── Audit ─────────────────────────────────────── */}
          {showAudit && (
            <NavLink
              to="/audit-logs"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-teal-50 text-teal-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`
              }
            >
              <History size={18} />
              Historique
            </NavLink>
          )}

        </nav>

        {/* ── Pied de sidebar : infos utilisateur ───────────── */}
        <div className="shrink-0 border-t border-slate-200 p-4 space-y-3">
          <div className="flex items-center gap-3">
            {/* Avatar initiale */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">
              {user?.nom?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-800">
                {user?.nom}
              </div>
              <div className="truncate text-xs text-slate-500">
                {user?.email}
              </div>
            </div>
          </div>

          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-rose-600"
            onClick={logout}
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ─────────────────────────────── */}
      <div className="lg:pl-72">

        {/* Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-8">
          <button
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>

          <div className="ml-auto flex items-center gap-3">
            {/* Agence de l'utilisateur */}
            {user?.agence && (
              <span className="hidden text-sm text-slate-500 sm:block">
                {user.agence}
              </span>
            )}

            {/* Badge rôle */}
            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
              {user?.role?.libelle ?? 'Utilisateur'}
            </span>
          </div>
        </header>

        {/* Page */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>

      </div>
    </div>
  )
}