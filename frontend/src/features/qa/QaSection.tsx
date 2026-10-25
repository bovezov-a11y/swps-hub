import { CheckCircle2, MessageCircleQuestion, MessageSquare, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { EmptyState, ErrorState } from '../../components/EmptyState'
import { TextAreaField, TextField } from '../../components/fields'
import { FormAlert } from '../../components/FormAlert'
import { ListSkeleton } from '../../components/Skeleton'
import { relativeDay } from '../../lib/dates'
import type { CourseDetail } from '../../lib/types'
import { useAsk, useQuestions, type QuestionFilters } from './api'

export function QaSection({ course }: { course: CourseDetail }) {
  const [filters, setFilters] = useState<QuestionFilters>({ filter: 'all', sort: 'top' })
  const [asking, setAsking] = useState(false)
  const questions = useQuestions(course.id, filters)

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
      active ? 'bg-slate-900 text-white shadow-sm' : 'bg-white text-slate-700 shadow-xs ring-1 ring-slate-200 hover:bg-slate-50'
    }`

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Show questions">
          <button type="button" aria-pressed={filters.filter === 'all'} onClick={() => setFilters({ ...filters, filter: 'all' })} className={chip(filters.filter === 'all')}>
            All
          </button>
          <button type="button" aria-pressed={filters.filter === 'unanswered'} onClick={() => setFilters({ ...filters, filter: 'unanswered' })} className={chip(filters.filter === 'unanswered')}>
            Unanswered
          </button>
          <select
            value={filters.sort}
            onChange={(event) => setFilters({ ...filters, sort: event.target.value as QuestionFilters['sort'] })}
            aria-label="Sort questions"
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          >
            <option value="top">Most upvoted</option>
            <option value="new">Newest</option>
          </select>
        </div>
        {!asking && (
          <Button onClick={() => setAsking(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Ask a question
          </Button>
        )}
      </div>

      {asking && <AskForm courseId={course.id} onDone={() => setAsking(false)} />}

      <div className="mt-6">
        {questions.isPending ? (
          <ListSkeleton />
        ) : questions.isError ? (
          <ErrorState text="Could not load questions." />
        ) : questions.data.length === 0 ? (
          <EmptyState
            icon={MessageCircleQuestion}
            title={filters.filter === 'unanswered' ? 'Every question has an answer' : 'No questions yet'}
            text="Stuck on something? Ask anonymously. Classmates and students from earlier years can help."
          />
        ) : (
          <ul className="space-y-3">
            {questions.data.map((question) => (
              <li key={question.id}>
                <Link
                  to={`/questions/${question.id}`}
                  className="card flex gap-4 p-4 transition duration-200 hover:border-indigo-200 hover:shadow-card-hover sm:p-5"
                >
                  <div className="flex w-16 shrink-0 flex-col items-center gap-1 text-center">
                    <span className="text-lg font-semibold tabular-nums">{question.voteCount}</span>
                    <span className="text-[11px] text-slate-500">votes</span>
                    <span
                      className={`mt-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                        question.solved
                          ? 'bg-emerald-50 text-emerald-700'
                          : question.answerCount > 0
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-amber-50 text-amber-800'
                      }`}
                    >
                      {question.solved ? <CheckCircle2 className="size-3" aria-hidden="true" /> : <MessageSquare className="size-3" aria-hidden="true" />}
                      {question.answerCount}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900">{question.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">{question.excerpt}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Asked by {question.mine ? 'you' : 'a student'} · {relativeDay(question.createdAt).toLowerCase()}
                      {question.solved && ' · solved'}
                      {question.hidden && ' · hidden by moderators'}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function AskForm({ courseId, onDone }: { courseId: string; onDone: () => void }) {
  const ask = useAsk(courseId)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    ask.mutate({ title: title.trim(), body: body.trim() }, { onSuccess: onDone })
  }

  return (
    <form onSubmit={submit} className="mt-5 space-y-4 rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm" aria-label="Ask a question">
      <div>
        <h3 className="font-semibold">Ask a question</h3>
        <p className="mt-1 text-sm text-slate-500">Your name is never shown. Others see “a student”.</p>
      </div>
      {ask.isError && <FormAlert message={ask.error.message} />}
      <TextField label="Question" value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} placeholder="How is the final exam graded?" />
      <TextAreaField label="Details" value={body} maxLength={5000} rows={4} onChange={(event) => setBody(event.target.value)} placeholder="What have you tried, what is unclear…" />
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" isLoading={ask.isPending} disabled={!title.trim() || !body.trim()}>
          Post question
        </Button>
      </div>
    </form>
  )
}
