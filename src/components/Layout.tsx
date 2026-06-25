import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { GroupsIcon, FriendsIcon, ActivityIcon, AccountIcon } from './Icons'

const navItems = [
  { to: '/', label: 'Grupos', Icon: GroupsIcon },
  { to: '/friends', label: 'Amigos', Icon: FriendsIcon },
  { to: '/activity', label: 'Actividad', Icon: ActivityIcon },
  { to: '/account', label: 'Cuenta', Icon: AccountIcon },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { user } = useAuth()

  return (
    <div className="mx-auto flex min-h-full max-w-5xl bg-[#f4f6f8]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-gray-200 bg-white p-4 sm:flex">
        <div className="mb-8 flex items-center gap-2 px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 font-bold text-white">
            S
          </span>
          <span className="text-lg font-bold text-gray-800">Split App</span>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto truncate px-2 text-xs text-gray-400">{user?.email}</div>
      </aside>

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 pb-24 sm:pb-8">{children}</main>
      </div>

      {/* Bottom nav (móvil) */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-gray-200 bg-white/95 backdrop-blur sm:hidden">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                isActive ? 'text-brand-600' : 'text-gray-500'
              }`
            }
          >
            <Icon className="h-6 w-6" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
