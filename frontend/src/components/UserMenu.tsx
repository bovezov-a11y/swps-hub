import { BookOpen, CalendarDays, ChevronDown, LogOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../features/auth/auth-context'

export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const itemClass =
    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900'

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition hover:bg-slate-100"
      >
        <Avatar name={user?.displayName ?? ''} />
        <ChevronDown className={`size-4 text-slate-500 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-64 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10"
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar name={user?.displayName ?? ''} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{user?.displayName}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <div className="my-1 border-t border-slate-100" />
          <Link role="menuitem" to="/my-courses" onClick={() => setOpen(false)} className={itemClass}>
            <BookOpen className="size-4 text-slate-400" aria-hidden="true" />
            My courses
          </Link>
          <Link role="menuitem" to="/calendar" onClick={() => setOpen(false)} className={itemClass}>
            <CalendarDays className="size-4 text-slate-400" aria-hidden="true" />
            Calendar
          </Link>
          <div className="my-1 border-t border-slate-100" />
          <button role="menuitem" type="button" onClick={logout} className={itemClass}>
            <LogOut className="size-4 text-slate-400" aria-hidden="true" />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-violet-600 text-sm font-semibold text-white"
    >
      {initials}
    </span>
  )
}
