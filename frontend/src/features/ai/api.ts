import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { Material } from '../../lib/types'

export type AiStatus = { enabled: boolean; dailyLimit: number; usedToday: number }

export type Summary = {
  overview: string
  keyPoints: string[]
  keyTerms: { term: string; definition: string }[]
}

export type Quiz = {
  questions: { question: string; options: string[]; correctOptionIndex: number; explanation: string }[]
}

export type StudyAidKind = 'summary' | 'quiz'

const MAX_FILE_SIZE = 20 * 1024 * 1024
const SUPPORTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain', 'text/markdown']

/** Mirrors the backend: the model reads PDFs, images and text directly; Office files would need converting. */
export const supportsAi = (material: Material) =>
  SUPPORTED_TYPES.includes(material.contentType) && material.fileSize <= MAX_FILE_SIZE

const statusKey = ['ai', 'status'] as const

export function useAiStatus() {
  return useQuery({ queryKey: statusKey, queryFn: () => api<AiStatus>('/ai/status'), staleTime: 60_000 })
}

/** Loads a study aid, generating it on first use. Results never change, so they are cached for the session. */
export function useStudyAid<K extends StudyAidKind>(materialId: string, kind: K) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: ['ai', kind, materialId],
    queryFn: async () => {
      const result = await api<K extends 'summary' ? Summary : Quiz>(`/materials/${materialId}/ai/${kind}`, {
        method: 'POST',
      })
      void queryClient.invalidateQueries({ queryKey: statusKey })
      return result
    },
    staleTime: Infinity,
    retry: false,
  })
}
