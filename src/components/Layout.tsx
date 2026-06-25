import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/', label: 'Inicio', icon: '🏠' },
  { to: '/account', label: 'Cuenta', icon: '👤' },
]

// Layout responsive:
// - Móvil: barra de navegación inferior (estilo app).
// - Desktop: barra lateral fija a la izquierda.
export default function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth()

  return (
    <div className="flex min-h-full flex-col bg-slate-950 text-slate-100 sm:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-800 bg-slate-900 p-4 sm:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 font-bold">
            S
          </span>
          <span className="text-lg font-bold">Split App</span>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-indigo-500 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-slate-800 pt-4">
          <p className="truncate px-2 text-xs text-slate-400">{user?.email}</p>
          <button
            onClick={signOut}
            className="mt-2 w-full rounded-xl px-3 py-2 text-left text-sm text-slate-300 hover:bg-slate-800"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Top bar (móvil) */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3 sm:hidden">
        <span className="flex items-center gap-2 font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500 text-sm">
            S
          </span>
          Split App
        </span>
        <button onClick={signOut} className="text-sm text-slate-400">
          Salir
        </button>
      </header>

      {/* Contenido */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 sm:p-8 sm:pb-8">{children}</main>

      {/* Bottom nav (móvil) */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-800 bg-slate-900 sm:hidden">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-3 text-xs ${
                isActive ? 'text-indigo-400' : 'text-slate-400'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
