import { Layers, Plus, Sparkles, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button, LinkButton } from '../../components/Button'
import { EmptyState, ErrorState } from '../../components/EmptyState'
import { TextAreaField, TextField } from '../../components/fields'
import { FormAlert } from '../../components/FormAlert'
import { CardGridSkeleton } from '../../components/Skeleton'
import type { CourseDetail } from '../../lib/types'
import { useCreateDeck, useDecks, useDeleteDeck } from './api'
import { parseCards } from './parse-cards'

export function FlashcardsSection({ course }: { course: CourseDetail }) {
  const decks = useDecks(course.id)
  const remove = useDeleteDeck(course.id)
  const [creating, setCreating] = useState(false)

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-slate-600">
          Decks are shared with the course; your progress is private. Cards come back just before you would forget
          them (spaced repetition).
        </p>
        {!creating && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" aria-hidden="true" />
            New deck
          </Button>
        )}
      </div>

      {creating && <CreateDeckForm courseId={course.id} onDone={() => setCreating(false)} />}

      <div className="mt-6">
        {decks.isPending ? (
          <CardGridSkeleton count={3} />
        ) : decks.isError ? (
          <ErrorState text="Could not load flashcard decks." />
        ) : decks.data.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No flashcards yet"
            text="Make a deck yourself, or open a shared PDF and let AI turn it into flashcards."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.data.map((deck) => (
              <li key={deck.id} className="card flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    {deck.aiGenerated ? <Sparkles className="size-5" aria-hidden="true" /> : <Layers className="size-5" aria-hidden="true" />}
                  </span>
                  {deck.dueCount > 0 ? (
                    <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white">{deck.dueCount} to study</span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">All caught up</span>
                  )}
                </div>
                <h3 className="mt-3 font-semibold">{deck.title}</h3>
                {deck.description && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{deck.description}</p>}
                <p className="mt-1 text-xs text-slate-500">
                  {deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'}
                  {deck.aiGenerated && ' · made by AI'}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <LinkButton to={`/decks/${deck.id}/study`} size="sm" variant={deck.dueCount > 0 ? 'primary' : 'secondary'}>
                    {deck.dueCount > 0 ? 'Study now' : 'Review anyway'}
                  </LinkButton>
                  {deck.mine && (
                    <button
                      type="button"
                      onClick={() => window.confirm(`Delete "${deck.title}"?`) && remove.mutate(deck.id)}
                      aria-label={`Delete ${deck.title}`}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function CreateDeckForm({ courseId, onDone }: { courseId: string; onDone: () => void }) {
  const create = useCreateDeck(courseId)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const cards = parseCards(text)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    create.mutate({ title: title.trim(), description: '', cards }, { onSuccess: onDone })
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4 rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm" aria-label="New deck">
      <h3 className="font-semibold">New flashcard deck</h3>
      {create.isError && <FormAlert message={create.error.message} />}
      <TextField label="Deck name" maxLength={150} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Key terms, week 1–4" />
      <TextAreaField
        label="Cards"
        rows={6}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={'Mean ; The average of all values\nMedian ; The middle value when sorted'}
        hint={`One card per line: front ; back. ${cards.length} ${cards.length === 1 ? 'card' : 'cards'} ready.`}
      />
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" isLoading={create.isPending} disabled={!title.trim() || cards.length === 0}>
          Create deck
        </Button>
      </div>
    </form>
  )
}
