import { useState } from 'react'
import { Link } from 'react-router'
import { Button, LinkButton } from '../../components/Button'
import { EmptyState, ErrorState } from '../../components/EmptyState'
import { EventTypeBadge } from '../../components/EventTypeBadge'
import { Spinner } from '../../components/Spinner'
import { addDays, dayKey, formatShortDay, formatTimeRange, formatWeekRange, startOfWeek } from '../../lib/dates'
import { eventTypes } from '../../lib/event-types'
import type { CalendarEvent } from '../../lib/types'
import { useCalendar } from './api'
import { SubscribeCard } from './SubscribeCard'

export function CalendarPage() {
  const [today] = useState(() => new Date())
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today))
  const calendar = useCalendar(weekStart, addDays(weekStart, 7))
  const todayKey = dayKey(today)
  const days = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))

  const eventsByDay = new Map<string, CalendarEvent[]>()
  for (const event of calendar.data ?? []) {
    const key = dayKey(new Date(event.startsAt))
    eventsByDay.set(key, [...(eventsByDay.get(key) ?? []), event])
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Calendar</h1>
          <p className="mt-2 text-slate-600">Every event from the courses you joined.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold" aria-live="polite">
              {formatWeekRange(weekStart)}
            </h2>
            <div className="flex items-center gap-2">
              {calendar.isFetching && <Spinner className="size-4 text-indigo-600" />}
              <Button variant="secondary" size="sm" onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Previous week">
                ←
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setWeekStart(startOfWeek(today))}>
                Today
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Next week">
                →
              </Button>
            </div>
          </div>

          <div className="mt-5">
            {calendar.isPending ? (
              <div className="flex justify-center py-16 text-indigo-600">
                <Spinner />
              </div>
            ) : calendar.isError ? (
              <ErrorState text="Could not load your calendar." />
            ) : (
              <>
                {calendar.data.length === 0 && (
                  <div className="mb-5">
                    <EmptyState
                      title="Nothing this week"
                      text="Events from the courses you join show up here. Joined a course already? Check another week."
                      action={
                        <LinkButton to="/explore" variant="secondary">
                          Browse courses
                        </LinkButton>
                      }
                    />
                  </div>
                )}
                <ol className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
                  {days.map((day) => {
                    const key = dayKey(day)
                    const events = eventsByDay.get(key) ?? []
                    const isToday = key === todayKey
                    return (
                      <li key={key} className="flex gap-4 px-4 py-4 sm:px-5">
                        <div className="w-24 shrink-0">
                          <p className={`text-sm font-semibold ${isToday ? 'text-indigo-600' : 'text-slate-900'}`}>
                            {formatShortDay(day)}
                          </p>
                          {isToday && <p className="text-xs font-medium text-indigo-600">Today</p>}
                        </div>
                        <ul className="min-w-0 flex-1 space-y-2">
                          {events.length === 0 ? (
                            <li className="text-sm text-slate-400">No events</li>
                          ) : (
                            events.map((event) => <CalendarItem key={event.id} event={event} />)
                          )}
                        </ul>
                      </li>
                    )
                  })}
                </ol>
              </>
            )}
          </div>
        </div>

        <aside>
          <SubscribeCard />
        </aside>
      </div>
    </>
  )
}

function CalendarItem({ event }: { event: CalendarEvent }) {
  return (
    <li className="relative flex gap-3 rounded-lg bg-slate-50 py-2 pr-3 pl-4">
      <span className={`absolute inset-y-2 left-1.5 w-1 rounded-full ${eventTypes[event.type].accent}`} aria-hidden="true" />
      <span className="w-24 shrink-0 text-sm font-medium tabular-nums">{formatTimeRange(event.startsAt, event.endsAt)}</span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{event.title}</span>
          <EventTypeBadge type={event.type} />
        </div>
        <p className="mt-0.5 truncate text-sm text-slate-500">
          <Link to={`/courses/${event.course.id}`} className="hover:text-indigo-600">
            {event.course.code} · {event.course.name}
          </Link>
          {event.location && ` · ${event.location}`}
        </p>
      </div>
    </li>
  )
}
