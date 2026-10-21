import { ArrowRight, BookOpen, CalendarClock, CalendarDays, Compass, FileText, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { LinkButton } from '../components/Button'
import { DateChip } from '../components/DateChip'
import { EmptyState, ErrorState } from '../components/EmptyState'
import { EventTypeBadge } from '../components/EventTypeBadge'
import { ProgramIcon } from '../components/ProgramIcon'
import { ListSkeleton, Skeleton } from '../components/Skeleton'
import { useAuth } from '../features/auth/auth-context'
import { useCalendar } from '../features/calendar/api'
import { useCourses } from '../features/courses/api'
import { useMaterialFeed } from '../features/materials/api'
import { materialTypes } from '../lib/academic'
import { addDays, formatLongDay, formatTimeRange, relativeDay } from '../lib/dates'
import { eventTypes, isAssessment } from '../lib/event-types'
import { fileKind } from '../lib/file-kinds'
import type { CalendarEvent } from '../lib/types'

export function DashboardPage() {
  const { user } = useAuth()
  const firstName = user?.displayName.split(' ')[0]
  // Fixed for the lifetime of the page so the calendar query key stays stable between renders.
  const [now] = useState(() => new Date())
  const calendar = useCalendar(now, addDays(now, 60))
  const myCourses = useCourses({ mine: true, size: 8 })
  const feed = useMaterialFeed()

  const nextUp = calendar.data?.filter((event) => !isAssessment(event.type)).slice(0, 5) ?? []
  const assessments = calendar.data?.filter((event) => isAssessment(event.type)) ?? []
  const nextAssessment = assessments[0]

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-600 via-indigo-600 to-violet-600 p-6 text-white shadow-xl shadow-indigo-600/20 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -right-16 size-80 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-32 left-1/3 size-72 rounded-full bg-fuchsia-400/20 blur-3xl" />
        </div>
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-200">
              {greeting(now)} · {formatLongDay(now)}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Hi, {firstName} 👋</h1>
            <p className="mt-2 max-w-md text-indigo-100">
              {calendar.isPending
                ? 'Checking what is coming up…'
                : nextAssessment
                  ? `Next up: ${nextAssessment.title} in ${nextAssessment.course.code}, ${relativeDay(nextAssessment.startsAt).toLowerCase()}.`
                  : 'No exams or deadlines in the next 60 days. Enjoy it!'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton to="/explore" variant="white">
                <Compass className="size-4" aria-hidden="true" />
                Explore courses
              </LinkButton>
              <LinkButton
                to="/calendar"
                className="bg-white/10 text-white ring-1 ring-white/25 ring-inset hover:bg-white/20"
              >
                <CalendarDays className="size-4" aria-hidden="true" />
                Open calendar
              </LinkButton>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-3 lg:w-[26rem]">
            <Stat icon={BookOpen} label="Courses" value={myCourses.data?.totalItems} />
            <Stat icon={CalendarClock} label="Exams & deadlines" value={calendar.data ? assessments.length : undefined} />
            <Stat icon={FileText} label="New files" value={feed.data?.length} />
          </dl>
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Exams & deadlines" icon={CalendarClock} action={<PanelLink to="/calendar">Calendar</PanelLink>}>
            <EventPanelBody
              query={calendar}
              events={assessments.slice(0, 5)}
              emptyText="No exams or deadlines in the next 60 days."
              showRelative
            />
          </Panel>
          <Panel title="Next classes" icon={CalendarDays} action={<PanelLink to="/calendar">Full week</PanelLink>}>
            <EventPanelBody query={calendar} events={nextUp} emptyText="No classes scheduled in the next 60 days." />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Your courses" icon={BookOpen} action={<PanelLink to="/my-courses">All</PanelLink>}>
            {myCourses.isPending ? (
              <ListSkeleton />
            ) : myCourses.isError ? (
              <ErrorState text="Could not load your courses." />
            ) : myCourses.data.items.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No courses yet"
                text="Join your courses to fill your timetable."
                action={<LinkButton to="/explore">Explore programs</LinkButton>}
              />
            ) : (
              <ul className="-mx-2 space-y-1">
                {myCourses.data.items.map((course) => (
                  <li key={course.id}>
                    <Link
                      to={`/courses/${course.id}`}
                      className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50"
                    >
                      <ProgramIcon slug={course.program.slug} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium group-hover:text-indigo-600">
                          {course.name}
                        </span>
                        <span className="font-mono text-xs text-slate-500">{course.code}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="New in your courses" icon={FileText}>
            {feed.isPending ? (
              <ListSkeleton />
            ) : feed.isError ? (
              <ErrorState text="Could not load new materials." />
            ) : feed.data.length === 0 ? (
              <p className="text-sm text-slate-500">Notes and past exams shared in your courses will show up here.</p>
            ) : (
              <ul className="-mx-2 space-y-1">
                {feed.data.map((material) => {
                  const { icon: Icon, classes } = fileKind(material.fileName)
                  return (
                    <li key={material.id}>
                      <Link
                        to={`/courses/${material.course.id}`}
                        className="group flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-slate-50"
                      >
                        <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ${classes}`}>
                          <Icon className="size-4.5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium group-hover:text-indigo-600">
                            {material.title}
                          </span>
                          <span className="text-xs text-slate-500">
                            {materialTypes[material.type].label} · {material.course.code} ·{' '}
                            {relativeDay(material.createdAt).toLowerCase()}
                          </span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  )
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number | undefined }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
      <Icon className="size-5 text-indigo-200" aria-hidden="true" />
      <dd className="mt-3 text-2xl font-semibold tabular-nums">
        {value ?? <Skeleton className="h-8 w-8 bg-white/20" />}
      </dd>
      <dt className="mt-0.5 text-xs leading-tight text-indigo-200">{label}</dt>
    </div>
  )
}

type EventPanelBodyProps = {
  query: ReturnType<typeof useCalendar>
  events: CalendarEvent[]
  emptyText: string
  showRelative?: boolean
}

function EventPanelBody({ query, events, emptyText, showRelative = false }: EventPanelBodyProps) {
  if (query.isPending) return <ListSkeleton />
  if (query.isError) return <ErrorState text="Could not load your schedule." />
  if (events.length === 0) return <p className="text-sm text-slate-500">{emptyText}</p>
  return (
    <ul className="-mx-2 space-y-1">
      {events.map((event) => (
        <li key={event.id}>
          <Link
            to={`/courses/${event.course.id}?tab=schedule`}
            className="group flex items-center gap-4 rounded-xl px-2 py-2 transition hover:bg-slate-50"
          >
            <DateChip iso={event.startsAt} accent={eventTypes[event.type].accent} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-semibold group-hover:text-indigo-600">{event.title}</span>
                <EventTypeBadge type={event.type} />
              </div>
              <p className="mt-0.5 truncate text-sm text-slate-500">
                {formatTimeRange(event.startsAt, event.endsAt)} · {event.course.code} · {event.course.name}
              </p>
            </div>
            {showRelative && (
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                {relativeDay(event.startsAt)}
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function Panel({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string
  icon: LucideIcon
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold">
          <Icon className="size-4.5 text-indigo-500" aria-hidden="true" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function PanelLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-500"
    >
      {children}
      <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  )
}

function greeting(now: Date) {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
