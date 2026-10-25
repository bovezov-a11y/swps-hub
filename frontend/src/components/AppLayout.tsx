import { BookOpen, CalendarDays, Compass, HeartPulse, LayoutDashboard, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { Disclaimer } from './Disclaimer'
import { Logo } from './Logo'
import { UserMenu } from './UserMenu'

const navigation = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/my-courses', label: 'My courses', icon: BookOpen },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/wellbeing', label: 'Wellbeing', icon: HeartPulse },
]

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
  }`

export function AppLayout() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(60rem_30rem_at_50%_-10rem,rgb(99_102_241/0.09),transparent)]">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <NavLink to="/" aria-label="SWPS Hub home" className="shrink-0">
            <Logo />
          </NavLink>
          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="Main">
            {navigation.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === '/'} className={navLinkClass}>
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {/* The explore page has its own large search box. */}
            {pathname !== '/explore' && <HeaderSearch />}
            <UserMenu />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden" aria-label="Main">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={navLinkClass}>
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="mx-auto w-full max-w-6xl px-4 pt-4 pb-10 sm:px-6">
        <div className="flex flex-col gap-2 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <Disclaimer className="text-slate-400 sm:max-w-md sm:text-right" />
        </div>
      </footer>
    </div>
  )
}

function HeaderSearch() {
  const navigate = useNavigate()
  const [text, setText] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!text.trim()) return
    navigate(`/explore?q=${encodeURIComponent(text.trim())}`)
    setText('')
  }

  return (
    <form onSubmit={submit} role="search" className="relative hidden lg:block">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        type="search"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Search any course…"
        aria-label="Search all courses"
        className="w-60 rounded-xl border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-sm outline-none transition placeholder:text-slate-400 focus:w-72 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
      />
    </form>
  )
}
