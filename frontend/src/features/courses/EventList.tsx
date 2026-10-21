import { EventTypeBadge } from '../../components/EventTypeBadge'
import { formatLongDay, formatTimeRange, groupByDay } from '../../lib/dates'
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
          <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {group.items.map((event) => (
              <li key={event.id} className="flex items-center gap-4 px-4 py-3">
                <span className="w-24 shrink-0 text-sm font-medium text-slate-900 tabular-nums">
                  {formatTimeRange(event.startsAt, event.endsAt)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <EventTypeBadge type={event.type} />
                    <span className="truncate text-sm font-medium">{event.title}</span>
                  </div>
                  {event.location && <p className="mt-0.5 truncate text-sm text-slate-500">{event.location}</p>}
                </div>
                {event.canDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(event)}
                    className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label={`Delete ${event.title}`}
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-4" aria-hidden="true">
                      <path d="M4 6h12M8 6V4h4v2m-6 0 .7 10h6.6L14 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
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
