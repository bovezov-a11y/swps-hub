import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../features/auth/auth-context'
import { Logo } from './Logo'

const navigation = [
  { to: '/', label: 'Dashboard', available: true },
  { to: '/courses', label: 'Courses', available: false },
  { to: '/calendar', label: 'Calendar', available: false },
]

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden items-center gap-1 sm:flex">
              {navigation.map((item) =>
                item.available ? (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end
                    className={({ isActive }) =>
                      `rounded-md px-3 py-2 text-sm font-medium transition ${
                        isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ) : (
                  <span key={item.to} className="cursor-default px-3 py-2 text-sm font-medium text-slate-400">
                    {item.label}
                    <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 uppercase">
                      Soon
                    </span>
                  </span>
                ),
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-medium text-slate-900">{user?.displayName}</span>
              <span className="block text-xs text-slate-500">{user?.email}</span>
            </span>
            <span
              aria-hidden="true"
              className="flex size-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700"
            >
              {initials(user?.displayName ?? '')}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}
