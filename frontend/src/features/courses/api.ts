import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { CourseDetail, CourseEvent, CourseSummary, EventType, Page } from '../../lib/types'

export type CourseFilters = {
  q: string
  semester: string
  mine: boolean
  page: number
}

export type CourseInput = {
  code: string
  name: string
  semester: string
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

export function useCourses(filters: CourseFilters) {
  const params = new URLSearchParams({ page: String(filters.page) })
  if (filters.q) params.set('q', filters.q)
  if (filters.semester) params.set('semester', filters.semester)
  if (filters.mine) params.set('mine', 'true')
  return useQuery({
    queryKey: courseKeys.list(filters),
    queryFn: () => api<Page<CourseSummary>>(`/courses?${params}`),
    placeholderData: keepPreviousData,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: courseKeys.all }),
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
