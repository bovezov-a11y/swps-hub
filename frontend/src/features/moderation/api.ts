import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { ContentType, ReportReason } from '../../lib/types'

export type QueueItem = {
  type: ContentType
  id: string
  content: { title: string; excerpt: string; courseCode: string; link: string; hidden: boolean }
  reportCount: number
  reasons: Partial<Record<ReportReason, number>>
  details: string[]
  firstReportedAt: string
}

export type LogEntry = {
  action: 'AUTO_HIDE' | 'HIDE' | 'RESTORE' | 'DELETE'
  type: ContentType
  summary: string
  moderator: string
  at: string
}

export type StaffMember = { id: string; displayName: string; email: string; role: 'MODERATOR' | 'ADMIN' }

export const reportReasons: Record<ReportReason, string> = {
  COPYRIGHT: 'Copyright or not allowed to share',
  INAPPROPRIATE: 'Offensive or inappropriate',
  WRONG_COURSE: 'Wrong course',
  SPAM: 'Spam or advertising',
  OTHER: 'Something else',
}

export function useReport() {
  return useMutation({
    mutationFn: (report: { targetType: ContentType; targetId: string; reason: ReportReason; details: string }) =>
      api<void>('/reports', { method: 'POST', body: report }),
  })
}

export function useModerationQueue() {
  return useQuery({ queryKey: ['moderation', 'queue'], queryFn: () => api<QueueItem[]>('/moderation/queue') })
}

export function useModerationLog() {
  return useQuery({ queryKey: ['moderation', 'log'], queryFn: () => api<LogEntry[]>('/moderation/log') })
}

export function useModerationAction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ type, id, action }: { type: ContentType; id: string; action: 'hide' | 'restore' | 'delete' }) =>
      action === 'delete'
        ? api<void>(`/moderation/${type}/${id}`, { method: 'DELETE' })
        : api<void>(`/moderation/${type}/${id}/${action}`, { method: 'POST' }),
    // Moderation changes what everyone sees, so refresh every cached list.
    onSuccess: () => queryClient.invalidateQueries(),
  })
}

export function useModerators() {
  return useQuery({ queryKey: ['admin', 'moderators'], queryFn: () => api<StaffMember[]>('/admin/moderators') })
}

export function useAddModerator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (email: string) => api<StaffMember>('/admin/moderators', { method: 'POST', body: { email } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'moderators'] }),
  })
}

export function useRemoveModerator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) => api<void>(`/admin/moderators/${userId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'moderators'] }),
  })
}
