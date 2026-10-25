import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { EventType } from '../../lib/types'

export type WorkloadAssessment = {
  eventId: string
  type: EventType
  title: string
  courseCode: string
  startsAt: string
  planned: boolean
}

export type Workload = {
  days: { date: string; count: number; assessments: WorkloadAssessment[] }[]
  crunches: { from: string; to: string; assessments: WorkloadAssessment[] }[]
  crunchAssessments: number
  crunchDays: number
}

export function useWorkload(weeks = 16) {
  return useQuery({ queryKey: ['wellbeing', 'workload', weeks], queryFn: () => api<Workload>(`/me/workload?weeks=${weeks}`) })
}

/** Plans study sessions before an exam; they appear in the personal calendar and feed. */
export function useCreateStudyPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (examEventId: string) =>
      api<{ id: string; title: string; startsAt: string; endsAt: string }[]>('/me/study-plans', {
        method: 'POST',
        body: { examEventId },
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wellbeing'] }),
        queryClient.invalidateQueries({ queryKey: ['calendar'] }),
      ]),
  })
}

export function useDeleteStudySession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) => api<void>(`/me/study-sessions/${sessionId}`, { method: 'DELETE' }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wellbeing'] }),
        queryClient.invalidateQueries({ queryKey: ['calendar'] }),
      ]),
  })
}
