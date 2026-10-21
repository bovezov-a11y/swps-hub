import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../features/auth/auth-context'
import { Disclaimer } from './Disclaimer'
import { Logo } from './Logo'

const navigation = [
  { to: '/', label: 'Dashboard' },
  { to: '/explore', label: 'Explore' },
  { to: '/my-courses', label: 'My courses' },
  { to: '/calendar', label: 'Calendar' },
]

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-slate-900'
  }`

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <NavLink to="/" aria-label="SWPS Hub home">
              <Logo />
            </NavLink>
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
              {navigation.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-right md:block">
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
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 sm:hidden" aria-label="Main">
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pt-4 pb-10 sm:px-6">
        <Disclaimer className="border-t border-slate-200 pt-6 text-slate-400" />
      </footer>
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
