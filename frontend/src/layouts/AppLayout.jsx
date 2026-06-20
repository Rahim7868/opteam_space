import {
  Building2,
  ClipboardList,
  Gauge,
  History,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const adminLinks = [
  { to: '/', label: 'Tableau de bord', icon: Gauge },
  { to: '/bureaux', label: 'Bureaux de Change', icon: Building2 },
  { to: '/agents', label: 'Gestion des Agents', icon: Users },
  { to: '/fixings', label: 'Fixings', icon: ClipboardList },
  { to: '/historique', label: 'Historique', icon: History },
]

const agentLinks = [
  { to: '/', label: 'Tableau de bord', icon: Gauge },
  { to: '/bureaux', label: 'Bureaux de Change', icon: Building2 },
  { to: '/fixings', label: 'Gestion fixings', icon: ClipboardList },
]

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const links = isAdmin ? adminLinks : agentLinks

  return (
    <div className="min-h-screen bg-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div>
            <div className="text-lg font-black tracking-wide text-teal-800">OPTEAM_SPACE</div>
            <div className="text-xs font-medium uppercase text-slate-400">{user?.role}</div>
          </div>
          <button className="btn btn-secondary px-2 lg:hidden" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <nav className="space-y-1 p-4">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold ${
                  isActive ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4">
          <div className="mb-3 text-sm">
            <div className="font-semibold text-slate-800">{user?.name}</div>
            <div className="truncate text-slate-500">{user?.email}</div>
          </div>
          <button className="btn btn-secondary w-full" onClick={logout}>
            <LogOut size={16} />
            Deconnexion
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur lg:px-8">
          <button className="btn btn-secondary px-2 lg:hidden" onClick={() => setOpen(true)}>
            <Menu size={18} />
          </button>
          <div className="ml-auto text-right text-sm text-slate-500">
            {user?.role === 'admin' ? 'Administration centrale' : 'Agent'}
          </div>
        </header>
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
