import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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

export type SyllabusItem = {
  title: string
  type: 'EXAM' | 'DEADLINE'
  /** Only set when the syllabus gives an exact day. */
  date: string | null
  time: string | null
  weightPercent: number | null
  /** When it happens if there is no exact date, such as "week 8". */
  timing: string | null
}

export type SyllabusImport = { gradingSummary: string | null; items: SyllabusItem[] }

/** Sends a syllabus to the AI and returns the assessments it found. Nothing is saved until the student confirms. */
export function useReadSyllabus(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return api<SyllabusImport>(`/courses/${courseId}/ai/syllabus`, { method: 'POST', body: form })
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: statusKey }),
  })
}
