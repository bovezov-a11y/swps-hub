import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { CourseDetail, CourseEvent, CourseSummary, EventType, Page, Term } from '../../lib/types'

export type CourseFilters = {
  q?: string
  /** Program slug. */
  program?: string
  year?: number
  mine?: boolean
  page?: number
  size?: number
}

export type CourseInput = {
  programId: string
  studyYear: number
  term: Term
  code: string
  name: string
  lecturer: string
  description: string
}

export type EventInput = {
  type: EventType
  title: string
  startsAt: string
  endsAt: string
  location: string | null
  repeatWeeks: number | null
}

export const courseKeys = {
  all: ['courses'] as const,
  list: (filters: CourseFilters) => ['courses', 'list', filters] as const,
  detail: (id: string) => ['courses', 'detail', id] as const,
  events: (id: string) => ['courses', 'events', id] as const,
}

export function useCourses(filters: CourseFilters, { enabled = true } = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '' && value !== false) params.set(key, String(value))
  }
  return useQuery({
    queryKey: courseKeys.list(filters),
    queryFn: () => api<Page<CourseSummary>>(`/courses?${params}`),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useCourse(id: string | undefined) {
  return useQuery({
    queryKey: courseKeys.detail(id ?? ''),
    queryFn: () => api<CourseDetail>(`/courses/${id}`),
    enabled: id !== undefined,
  })
}

export function useCourseEvents(id: string) {
  return useQuery({
    queryKey: courseKeys.events(id),
    queryFn: () => api<CourseEvent[]>(`/courses/${id}/events`),
  })
}

export function useSaveCourse(id?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CourseInput) =>
      api<CourseDetail>(id ? `/courses/${id}` : '/courses', { method: id ? 'PUT' : 'POST', body: input }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: courseKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['programs'] }),
      ]),
  })
}

export function useEnrollment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ courseId, join }: { courseId: string; join: boolean }) =>
      api<void>(`/courses/${courseId}/enrollment`, { method: join ? 'PUT' : 'DELETE' }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: courseKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['calendar'] }),
        queryClient.invalidateQueries({ queryKey: ['materials', 'feed'] }),
      ]),
  })
}

export function useCreateEvents(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EventInput) =>
      api<CourseEvent[]>(`/courses/${courseId}/events`, { method: 'POST', body: input }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: courseKeys.events(courseId) }),
        queryClient.invalidateQueries({ queryKey: ['calendar'] }),
      ]),
  })
}

export function useDeleteEvent(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (eventId: string) => api<void>(`/events/${eventId}`, { method: 'DELETE' }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: courseKeys.events(courseId) }),
        queryClient.invalidateQueries({ queryKey: ['calendar'] }),
      ]),
  })
}
