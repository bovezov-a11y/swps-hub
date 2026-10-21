import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Material, MaterialType } from '../../lib/types'

export type MaterialFilters = {
  type: MaterialType | ''
  year: string
  sort: 'top' | 'new'
}

type VoteResponse = { voteCount: number; voted: boolean }

const materialKeys = {
  course: (courseId: string) => ['materials', 'course', courseId] as const,
  list: (courseId: string, filters: MaterialFilters) => ['materials', 'course', courseId, filters] as const,
  feed: ['materials', 'feed'] as const,
}

export function useMaterials(courseId: string, filters: MaterialFilters) {
  const params = new URLSearchParams({ sort: filters.sort })
  if (filters.type) params.set('type', filters.type)
  if (filters.year) params.set('year', filters.year)
  return useQuery({
    queryKey: materialKeys.list(courseId, filters),
    queryFn: () => api<Material[]>(`/courses/${courseId}/materials?${params}`),
  })
}

export function useMaterialFeed() {
  return useQuery({ queryKey: materialKeys.feed, queryFn: () => api<Material[]>('/materials/feed') })
}

/** Invalidates everything a new or removed material changes: lists, the feed and course file counts. */
function useInvalidateMaterials() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['materials'] }),
      queryClient.invalidateQueries({ queryKey: ['courses'] }),
      queryClient.invalidateQueries({ queryKey: ['programs'] }),
    ])
}

export function useUploadMaterial(courseId: string) {
  const invalidate = useInvalidateMaterials()
  return useMutation({
    mutationFn: (form: FormData) => api<Material>(`/courses/${courseId}/materials`, { method: 'POST', body: form }),
    onSuccess: invalidate,
  })
}

export function useDeleteMaterial() {
  const invalidate = useInvalidateMaterials()
  return useMutation({
    mutationFn: (materialId: string) => api<void>(`/materials/${materialId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}

/** Toggles a vote and updates the count immediately, rolling back if the server rejects it. */
export function useVote(courseId: string) {
  const queryClient = useQueryClient()
  const key = materialKeys.course(courseId)

  const apply = (materialId: string, voted: boolean) =>
    queryClient.setQueriesData<Material[]>({ queryKey: key }, (materials) =>
      materials?.map((material) =>
        material.id === materialId && material.voted !== voted
          ? { ...material, voted, voteCount: material.voteCount + (voted ? 1 : -1) }
          : material,
      ),
    )

  return useMutation({
    mutationFn: ({ material, voted }: { material: Material; voted: boolean }) =>
      api<VoteResponse>(`/materials/${material.id}/vote`, { method: voted ? 'PUT' : 'DELETE' }),
    onMutate: async ({ material, voted }) => {
      await queryClient.cancelQueries({ queryKey: key })
      apply(material.id, voted)
    },
    onError: (_error, { material, voted }) => apply(material.id, !voted),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
