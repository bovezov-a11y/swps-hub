import { Outlet } from 'react-router'
import { Logo } from './Logo'

const highlights = [
  { title: 'Your timetable, in one place', text: 'Lectures, labs and exams from every course you take.' },
  { title: 'Never miss an exam', text: 'Sync your calendar to Google, Apple or Outlook in one click.' },
  { title: 'Learn together', text: 'Share notes and materials with students in your courses.' },
]

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-indigo-950 p-12 text-white lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-32 size-[28rem] rounded-full bg-indigo-500/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-24 size-[24rem] rounded-full bg-fuchsia-500/20 blur-3xl"
        />
        <Logo inverted />
        <div className="relative">
          <h1 className="max-w-md text-4xl font-semibold tracking-tight text-balance">
            Everything you need for your semester at SWPS.
          </h1>
          <ul className="mt-10 space-y-6">
            {highlights.map((item) => (
              <li key={item.title} className="flex gap-4">
                <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/30 text-indigo-200">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.58l7.3-7.3a1 1 0 0 1 1.4 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="mt-1 text-sm text-indigo-200">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-indigo-300">Built by students, for students.</p>
      </aside>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
