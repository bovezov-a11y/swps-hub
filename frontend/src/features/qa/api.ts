import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'

export type QuestionSummary = {
  id: string
  title: string
  excerpt: string
  voteCount: number
  voted: boolean
  answerCount: number
  solved: boolean
  mine: boolean
  hidden: boolean
  createdAt: string
}

/** Who wrote an answer, from the viewer's point of view. Names are never shown in Q&A. */
export type AuthorLabel = 'YOU' | 'ASKER' | 'STUDENT'

export type AnswerView = {
  id: string
  body: string
  voteCount: number
  voted: boolean
  author: AuthorLabel
  accepted: boolean
  hidden: boolean
  createdAt: string
  canDelete: boolean
}

export type QuestionDetail = {
  id: string
  course: { id: string; code: string; name: string }
  title: string
  body: string
  voteCount: number
  voted: boolean
  mine: boolean
  hidden: boolean
  createdAt: string
  canDelete: boolean
  answers: AnswerView[]
}

export type QuestionFilters = { filter: 'all' | 'unanswered'; sort: 'top' | 'new' }

export function useQuestions(courseId: string, filters: QuestionFilters) {
  return useQuery({
    queryKey: ['questions', courseId, filters],
    queryFn: () =>
      api<QuestionSummary[]>(`/courses/${courseId}/questions?filter=${filters.filter}&sort=${filters.sort}`),
  })
}

export function useQuestion(questionId: string) {
  return useQuery({ queryKey: ['question', questionId], queryFn: () => api<QuestionDetail>(`/questions/${questionId}`) })
}

function useInvalidateQa() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['questions'] }),
      queryClient.invalidateQueries({ queryKey: ['question'] }),
    ])
}

export function useAsk(courseId: string) {
  const invalidate = useInvalidateQa()
  return useMutation({
    mutationFn: (input: { title: string; body: string }) =>
      api<{ id: string }>(`/courses/${courseId}/questions`, { method: 'POST', body: input }),
    onSuccess: invalidate,
  })
}

export function useAnswer(questionId: string) {
  const invalidate = useInvalidateQa()
  return useMutation({
    mutationFn: (body: string) =>
      api<{ id: string }>(`/questions/${questionId}/answers`, { method: 'POST', body: { body } }),
    onSuccess: invalidate,
  })
}

export function useQaVote() {
  const invalidate = useInvalidateQa()
  return useMutation({
    mutationFn: ({ kind, id, voted }: { kind: 'questions' | 'answers'; id: string; voted: boolean }) =>
      api<{ voteCount: number }>(`/${kind}/${id}/vote`, { method: voted ? 'PUT' : 'DELETE' }),
    onSuccess: invalidate,
  })
}

export function useAccept(questionId: string) {
  const invalidate = useInvalidateQa()
  return useMutation({
    mutationFn: (answerId: string | null) =>
      answerId
        ? api<void>(`/questions/${questionId}/accepted-answer`, { method: 'PUT', body: { answerId } })
        : api<void>(`/questions/${questionId}/accepted-answer`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}

export function useDeleteQa() {
  const invalidate = useInvalidateQa()
  return useMutation({
    mutationFn: ({ kind, id }: { kind: 'questions' | 'answers'; id: string }) =>
      api<void>(`/${kind}/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  })
}
