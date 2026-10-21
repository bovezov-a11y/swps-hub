import { useAuth } from '../features/auth/auth-context'

const upcoming = [
  {
    title: 'Your courses',
    text: 'Join the courses you take this semester to build your personal timetable.',
    icon: 'M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM13 4h5.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H13V4Z',
  },
  {
    title: 'Upcoming exams',
    text: 'Exams and deadlines from all your courses will show up here, soonest first.',
    icon: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  },
  {
    title: 'Calendar sync',
    text: 'Subscribe once in Google, Apple or Outlook Calendar and stay up to date automatically.',
    icon: 'M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4',
  },
]

export function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.displayName.split(' ')[0]

  return (
    <>
      <p className="text-sm font-medium text-indigo-600">{greeting()}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Hi, {firstName} 👋</h1>
      <p className="mt-2 text-slate-600">Here is what is coming to your Student Hub.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {upcoming.map((card) => (
          <section key={card.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <span className="flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-5" aria-hidden="true">
                <path d={card.icon} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 className="mt-4 font-semibold">{card.title}</h2>
            <p className="mt-1.5 text-sm text-slate-600">{card.text}</p>
            <p className="mt-4 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              Coming soon
            </p>
          </section>
        ))}
      </div>
    </>
  )
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
