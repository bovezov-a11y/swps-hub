import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { CalendarEvent } from '../../lib/types'

type FeedResponse = { path: string }

const feedKey = ['calendar', 'feed'] as const

export function useCalendar(from: Date, to: Date) {
  const range = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() })
  return useQuery({
    queryKey: ['calendar', 'events', range.toString()],
    queryFn: () => api<CalendarEvent[]>(`/calendar?${range}`),
  })
}

export function useCalendarFeed() {
  return useQuery({
    queryKey: feedKey,
    queryFn: () => api<FeedResponse>('/calendar/feed'),
    staleTime: Infinity,
  })
}

export function useResetCalendarFeed() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api<FeedResponse>('/calendar/feed/reset', { method: 'POST' }),
    onSuccess: (feed) => queryClient.setQueryData(feedKey, feed),
  })
}
