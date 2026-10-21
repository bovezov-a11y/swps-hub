import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { LinkButton } from '../components/Button'
import { EmptyState, ErrorState } from '../components/EmptyState'
import { EventTypeBadge } from '../components/EventTypeBadge'
import { Spinner } from '../components/Spinner'
import { useAuth } from '../features/auth/auth-context'
import { useCalendar } from '../features/calendar/api'
import { useCourses } from '../features/courses/api'
import { addDays, formatShortDay, formatTimeRange, relativeDay } from '../lib/dates'
import { isAssessment } from '../lib/event-types'
import type { CalendarEvent } from '../lib/types'

export function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.displayName.split(' ')[0]
  // Fixed for the lifetime of the page so the calendar query key stays stable between renders.
  const [now] = useState(() => new Date())
  const calendar = useCalendar(now, addDays(now, 60))
  const myCourses = useCourses({ q: '', semester: '', mine: true, page: 0 })

  const nextUp = calendar.data?.filter((event) => !isAssessment(event.type)).slice(0, 5) ?? []
  const assessments = calendar.data?.filter((event) => isAssessment(event.type)).slice(0, 5) ?? []

  return (
    <>
      <p className="text-sm font-medium text-indigo-600">{greeting(now)}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Hi, {firstName} 👋</h1>
      <p className="mt-2 text-slate-600">Here is what is coming up in your courses.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Exams & deadlines" action={<PanelLink to="/calendar">Calendar</PanelLink>}>
            <EventPanelBody
              query={calendar}
              events={assessments}
              emptyText="No exams or deadlines in the next 60 days."
              showRelative
            />
          </Panel>
          <Panel title="Next classes" action={<PanelLink to="/calendar">Full week</PanelLink>}>
            <EventPanelBody query={calendar} events={nextUp} emptyText="No classes scheduled in the next 60 days." />
          </Panel>
        </div>

        <Panel title="Your courses" action={<PanelLink to="/courses?mine=true">All</PanelLink>}>
          {myCourses.isPending ? (
            <PanelSpinner />
          ) : myCourses.isError ? (
            <ErrorState text="Could not load your courses." />
          ) : myCourses.data.items.length === 0 ? (
            <EmptyState
              title="No courses yet"
              text="Join your courses to fill your timetable."
              action={<LinkButton to="/courses">Browse courses</LinkButton>}
            />
          ) : (
            <ul className="-my-2 divide-y divide-slate-100">
              {myCourses.data.items.slice(0, 8).map((course) => (
                <li key={course.id}>
                  <Link to={`/courses/${course.id}`} className="group block py-2.5">
                    <span className="font-mono text-xs font-semibold text-indigo-700">{course.code}</span>
                    <span className="block truncate text-sm font-medium group-hover:text-indigo-600">{course.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}

type EventPanelBodyProps = {
  query: ReturnType<typeof useCalendar>
  events: CalendarEvent[]
  emptyText: string
  showRelative?: boolean
}

function EventPanelBody({ query, events, emptyText, showRelative = false }: EventPanelBodyProps) {
  if (query.isPending) return <PanelSpinner />
  if (query.isError) return <ErrorState text="Could not load your schedule." />
  if (events.length === 0) return <p className="py-4 text-sm text-slate-500">{emptyText}</p>
  return (
    <ul className="-my-2 divide-y divide-slate-100">
      {events.map((event) => (
        <li key={event.id} className="flex items-center gap-4 py-3">
          <div className="w-28 shrink-0">
            <p className="text-sm font-medium">{formatShortDay(new Date(event.startsAt))}</p>
            <p className="text-xs text-slate-500 tabular-nums">{formatTimeRange(event.startsAt, event.endsAt)}</p>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-medium">{event.title}</span>
              <EventTypeBadge type={event.type} />
            </div>
            <Link to={`/courses/${event.course.id}`} className="block truncate text-sm text-slate-500 hover:text-indigo-600">
              {event.course.code} · {event.course.name}
            </Link>
          </div>
          {showRelative && (
            <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {relativeDay(event.startsAt)}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

function Panel({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function PanelLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
      {children} →
    </Link>
  )
}

function PanelSpinner() {
  return (
    <div className="flex justify-center py-6 text-indigo-600">
      <Spinner className="size-5" />
    </div>
  )
}

function greeting(now: Date) {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
