import { describe, expect, it } from 'vitest'
import { dayKey, formatTimeRange, formatWeekRange, groupByDay, relativeDay, startOfWeek } from './dates'

describe('dates', () => {
  it('starts weeks on Monday', () => {
    expect(dayKey(startOfWeek(new Date(2026, 9, 21, 15, 30)))).toBe('2026-10-19')
    expect(dayKey(startOfWeek(new Date(2026, 9, 25, 23, 0)))).toBe('2026-10-19')
    expect(dayKey(startOfWeek(new Date(2026, 9, 26, 0, 0)))).toBe('2026-10-26')
  })

  it('formats week ranges within and across months', () => {
    expect(formatWeekRange(new Date(2026, 9, 19))).toBe('19 – 25 October 2026')
    expect(formatWeekRange(new Date(2026, 9, 26))).toBe('26 October – 1 November 2026')
  })

  it('groups events by local day in order', () => {
    const groups = groupByDay([
      { startsAt: new Date(2026, 9, 21, 9).toISOString() },
      { startsAt: new Date(2026, 9, 21, 14).toISOString() },
      { startsAt: new Date(2026, 9, 23, 9).toISOString() },
    ])

    expect(groups.map((group) => [dayKey(group.day), group.items.length])).toEqual([
      ['2026-10-21', 2],
      ['2026-10-23', 1],
    ])
  })

  it('describes days relative to today', () => {
    const now = new Date(2026, 9, 21, 23, 0)
    expect(relativeDay(new Date(2026, 9, 21, 8).toISOString(), now)).toBe('Today')
    expect(relativeDay(new Date(2026, 9, 22, 1).toISOString(), now)).toBe('Tomorrow')
    expect(relativeDay(new Date(2026, 9, 28, 1).toISOString(), now)).toBe('In 7 days')
  })

  it('shows a single time for deadlines', () => {
    const at = new Date(2026, 9, 21, 23, 59).toISOString()
    expect(formatTimeRange(at, at)).toBe('23:59')
  })
})
