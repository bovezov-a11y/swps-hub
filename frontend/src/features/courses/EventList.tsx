import { Clock, MapPin, Trash2 } from 'lucide-react'
import { EventTypeBadge } from '../../components/EventTypeBadge'
import { formatLongDay, formatTimeRange, groupByDay } from '../../lib/dates'
import { eventTypes } from '../../lib/event-types'
import type { CourseEvent } from '../../lib/types'

type EventListProps = {
  events: CourseEvent[]
  onDelete: (event: CourseEvent) => void
}

export function EventList({ events, onDelete }: EventListProps) {
  return (
    <div className="space-y-6">
      {groupByDay(events).map((group) => (
        <section key={group.day.toISOString()}>
          <h3 className="text-sm font-semibold text-slate-500">{formatLongDay(group.day)}</h3>
          <ul className="card mt-2 divide-y divide-slate-100 overflow-hidden">
            {group.items.map((event) => (
              <li key={event.id} className="relative flex items-center gap-4 px-5 py-3.5 transition hover:bg-slate-50/70">
                <span aria-hidden="true" className={`absolute inset-y-3 left-0 w-1 rounded-r-full ${eventTypes[event.type].accent}`} />
                <span className="inline-flex w-28 shrink-0 items-center gap-1.5 text-sm font-semibold text-slate-900 tabular-nums">
                  <Clock className="size-3.5 text-slate-400" aria-hidden="true" />
                  {formatTimeRange(event.startsAt, event.endsAt)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <EventTypeBadge type={event.type} />
                    <span className="truncate text-sm font-semibold">{event.title}</span>
                  </div>
                  {event.location && (
                    <p className="mt-0.5 inline-flex items-center gap-1 truncate text-sm text-slate-500">
                      <MapPin className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                      {event.location}
                    </p>
                  )}
                </div>
                {event.canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(event)}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${event.title}`}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
