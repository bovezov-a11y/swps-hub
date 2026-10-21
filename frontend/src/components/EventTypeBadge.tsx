import { eventTypes } from '../lib/event-types'
import type { EventType } from '../lib/types'

export function EventTypeBadge({ type }: { type: EventType }) {
  const { label, badge } = eventTypes[type]
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badge}`}>
      {label}
    </span>
  )
}
