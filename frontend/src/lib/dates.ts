const longDay = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
const shortDay = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
const dayMonth = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' })
const dayMonthYear = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

export const formatLongDay = (date: Date) => longDay.format(date)
export const formatShortDay = (date: Date) => shortDay.format(date)

export function formatTimeRange(startsAt: string, endsAt: string) {
  const start = time.format(new Date(startsAt))
  return startsAt === endsAt ? start : `${start}–${time.format(new Date(endsAt))}`
}

/** "19 – 25 October 2026", "27 October – 2 November 2026". */
export function formatWeekRange(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6)
  const start = weekStart.getMonth() === weekEnd.getMonth() ? String(weekStart.getDate()) : dayMonth.format(weekStart)
  return `${start} – ${dayMonthYear.format(weekEnd)}`
}

export function startOfDay(date: Date) {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

export function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/** Monday 00:00 of the week containing the date. */
export function startOfWeek(date: Date) {
  const day = (date.getDay() + 6) % 7
  return startOfDay(addDays(date, -day))
}

/** Local calendar day as YYYY-MM-DD, usable as a key and as an `<input type="date">` value. */
export function dayKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function groupByDay<T extends { startsAt: string }>(items: T[]) {
  const groups = new Map<string, { day: Date; items: T[] }>()
  for (const item of items) {
    const day = startOfDay(new Date(item.startsAt))
    const key = dayKey(day)
    const group = groups.get(key) ?? { day, items: [] }
    group.items.push(item)
    groups.set(key, group)
  }
  return [...groups.values()]
}

/** "Today", "Tomorrow", "In 5 days" or "2 days ago", counted in calendar days. */
export function relativeDay(iso: string, now = new Date()) {
  const days = Math.round((startOfDay(new Date(iso)).getTime() - startOfDay(now).getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  return days > 0 ? `In ${days} days` : `${-days} days ago`
}
