import { ArrowLeft, PartyPopper, RotateCcw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Button, LinkButton } from '../../components/Button'
import { ErrorState } from '../../components/EmptyState'
import { Skeleton } from '../../components/Skeleton'
import { useDeck, useReview, useStudyQueue, type Grade } from './api'

const grades: { grade: Grade; label: string; hint: string; key: string; classes: string }[] = [
  { grade: 'AGAIN', label: 'Again', hint: '< 10 min', key: '1', classes: 'bg-red-50 text-red-700 ring-red-200 hover:bg-red-100' },
  { grade: 'HARD', label: 'Hard', hint: 'soon', key: '2', classes: 'bg-amber-50 text-amber-800 ring-amber-200 hover:bg-amber-100' },
  { grade: 'GOOD', label: 'Good', hint: 'later', key: '3', classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200 hover:bg-emerald-100' },
  { grade: 'EASY', label: 'Easy', hint: 'much later', key: '4', classes: 'bg-sky-50 text-sky-700 ring-sky-200 hover:bg-sky-100' },
]

/** Flip-card study session. Space shows the answer, 1–4 grade it. */
export function StudyPage() {
  const { deckId } = useParams() as { deckId: string }
  const deck = useDeck(deckId)
  const queue = useStudyQueue(deckId)
  const review = useReview()
  const queryClient = useQueryClient()
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [again, setAgain] = useState<string[]>([])

  const cards = queue.data ?? []
  // Cards marked "Again" come back at the end of the session.
  const order = [...cards.map((card) => card.id), ...again]
  const current = cards.find((card) => card.id === order[index])
  const done = queue.isSuccess && index >= order.length

  const grade = useCallback(
    (value: Grade) => {
      if (!current || !revealed) return
      review.mutate({ cardId: current.id, grade: value })
      if (value === 'AGAIN') setAgain((ids) => [...ids, current.id])
      setRevealed(false)
      setIndex((position) => position + 1)
    },
    [current, revealed, review],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key === ' ') {
        event.preventDefault()
        setRevealed(true)
      }
      const match = grades.find((item) => item.key === event.key)
      if (match) grade(match.grade)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [grade])

  const finish = () => {
    void queryClient.invalidateQueries({ queryKey: ['decks'] })
    void queryClient.invalidateQueries({ queryKey: ['learning'] })
  }

  if (deck.isError || queue.isError) return <ErrorState text="Could not load this deck." />
  if (deck.isPending || queue.isPending) return <Skeleton className="mx-auto h-80 max-w-2xl rounded-3xl" />

  const backLink = `/courses/${deck.data.course.id}?tab=flashcards`

  return (
    <div className="mx-auto max-w-2xl">
      <Link to={backLink} onClick={finish} className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900">
        <ArrowLeft className="size-4" aria-hidden="true" />
        {deck.data.course.code} · Flashcards
      </Link>
      <div className="mt-3 flex items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{deck.data.title}</h1>
        {!done && order.length > 0 && (
          <span className="text-sm text-slate-500 tabular-nums" aria-live="polite">
            {Math.min(index + 1, order.length)} / {order.length}
          </span>
        )}
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-slate-100" aria-hidden="true">
        <div className="h-1.5 rounded-full bg-indigo-500 transition-all" style={{ width: `${order.length ? (index / order.length) * 100 : 100}%` }} />
      </div>

      {done || !current ? (
        <div className="card mt-8 p-10 text-center">
          <PartyPopper className="mx-auto size-10 text-indigo-500" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-semibold">{order.length === 0 ? 'Nothing to study right now' : 'Session complete'}</h2>
          <p className="mt-2 text-slate-600">
            {order.length === 0
              ? 'Every card in this deck is scheduled for later. Come back when they are due.'
              : `You went through ${order.length} ${order.length === 1 ? 'card' : 'cards'}. They will come back right before you would forget them.`}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <LinkButton to={backLink} onClick={finish}>
              Back to the course
            </LinkButton>
            {order.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => {
                  finish()
                  void queryClient.invalidateQueries({ queryKey: ['study', deckId] })
                  setIndex(0)
                  setAgain([])
                }}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Study more
              </Button>
            )}
          </div>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setRevealed(true)}
            aria-label={revealed ? 'Answer shown' : 'Show the answer'}
            className="mt-8 block w-full [perspective:1200px]"
          >
            <div
              className={`relative min-h-72 transition-transform duration-500 [transform-style:preserve-3d] ${revealed ? '[transform:rotateY(180deg)]' : ''}`}
            >
              <div
                aria-hidden={revealed}
                className="card absolute inset-0 flex flex-col items-center justify-center p-8 [backface-visibility:hidden]"
              >
                {current.isNew && (
                  <span className="absolute top-4 left-4 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">New</span>
                )}
                <p className="text-center text-2xl font-semibold text-balance">{current.front}</p>
                <p className="absolute bottom-4 text-xs text-slate-400">Click or press space to reveal</p>
              </div>
              <div
                aria-hidden={!revealed}
                className="card absolute inset-0 flex flex-col items-center justify-center bg-indigo-50/40 p-8 [backface-visibility:hidden] [transform:rotateY(180deg)]"
              >
                <p className="text-center text-sm font-medium text-slate-500">{current.front}</p>
                <p className="mt-4 text-center text-xl text-balance text-slate-900">{current.back}</p>
              </div>
            </div>
          </button>

          <div className="mt-6 grid grid-cols-4 gap-2" role="group" aria-label="How well did you remember it?">
            {grades.map((item) => (
              <button
                key={item.grade}
                type="button"
                disabled={!revealed}
                onClick={() => grade(item.grade)}
                className={`flex flex-col items-center rounded-xl py-3 text-sm font-semibold ring-1 transition disabled:opacity-40 ${item.classes}`}
              >
                {item.label}
                <span className="text-[11px] font-normal opacity-80">
                  {item.hint} · {item.key}
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
