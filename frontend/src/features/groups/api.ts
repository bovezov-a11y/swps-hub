import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'

export type StudyGroup = {
  id: string
  name: string
  description: string | null
  /** Only sent to members. */
  meetingDetails: string | null
  capacity: number
  memberCount: number
  member: boolean
  mine: boolean
  /** Names of the members, only sent to members. */
  members: string[]
  createdAt: string
  canDelete: boolean
}

export type GroupInput = { name: string; description: string; meetingDetails: string; capacity: number }

export function useGroups(courseId: string) {
  return useQuery({ queryKey: ['groups', courseId], queryFn: () => api<StudyGroup[]>(`/courses/${courseId}/groups`) })
}

function useInvalidateGroups(courseId: string) {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['groups', courseId] })
}

export function useCreateGroup(courseId: string) {
  const invalidate = useInvalidateGroups(courseId)
  return useMutation({
    mutationFn: (input: GroupInput) => api<StudyGroup>(`/courses/${courseId}/groups`, { method: 'POST', body: input }),
    onSuccess: invalidate,
  })
}

export function useGroupMembership(courseId: string) {
  const invalidate = useInvalidateGroups(courseId)
  return useMutation({
    mutationFn: ({ groupId, join }: { groupId: string; join: boolean }) =>
      api<unknown>(`/groups/${groupId}/membership`, { method: join ? 'PUT' : 'DELETE' }),
    onSuccess: invalidate,
  })
}

export function useDeleteGroup(courseId: string) {
  const invalidate = useInvalidateGroups(courseId)
  return useMutation({
    mutationFn: (groupId: string) => api<void>(`/groups/${groupId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}
