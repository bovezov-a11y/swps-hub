import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../lib/api'

export type DeckSummary = {
  id: string
  title: string
  description: string | null
  cardCount: number
  dueCount: number
  mine: boolean
  aiGenerated: boolean
  createdAt: string
}

export type DeckDetail = {
  id: string
  title: string
  description: string | null
  course: { id: string; code: string; name: string }
  cards: { id: string; front: string; back: string }[]
  aiGenerated: boolean
  canEdit: boolean
}

export type StudyCard = { id: string; front: string; back: string; isNew: boolean }

export type Grade = 'AGAIN' | 'HARD' | 'GOOD' | 'EASY'

export type CardInput = { front: string; back: string }

export function useDecks(courseId: string) {
  return useQuery({ queryKey: ['decks', courseId], queryFn: () => api<DeckSummary[]>(`/courses/${courseId}/decks`) })
}

export function useDeck(deckId: string) {
  return useQuery({ queryKey: ['deck', deckId], queryFn: () => api<DeckDetail>(`/decks/${deckId}`) })
}

export function useCreateDeck(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { title: string; description: string; cards: CardInput[] }) =>
      api<{ id: string }>(`/courses/${courseId}/decks`, { method: 'POST', body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['decks', courseId] }),
  })
}

export function useDeleteDeck(courseId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (deckId: string) => api<void>(`/decks/${deckId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['decks', courseId] }),
  })
}

/** The cards to study now. Loaded once per session so answering does not reshuffle the queue. */
export function useStudyQueue(deckId: string) {
  return useQuery({
    queryKey: ['study', deckId],
    queryFn: () => api<StudyCard[]>(`/decks/${deckId}/study`),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })
}

export function useReview() {
  return useMutation({
    mutationFn: ({ cardId, grade }: { cardId: string; grade: Grade }) =>
      api<{ nextDueAt: string; intervalDays: number }>(`/cards/${cardId}/reviews`, {
        method: 'POST',
        body: { grade },
      }),
  })
}

export function useLearningSummary() {
  return useQuery({
    queryKey: ['learning'],
    queryFn: () => api<{ dueCards: number; reviewedToday: number; streakDays: number }>('/me/learning'),
  })
}

/** Turns a material into a shared AI flashcard deck, or returns the deck made earlier. */
export function useGenerateFlashcards() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (materialId: string) =>
      api<{ deckId: string }>(`/materials/${materialId}/ai/flashcards`, { method: 'POST' }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['decks'] }),
        queryClient.invalidateQueries({ queryKey: ['ai', 'status'] }),
      ]),
  })
}
