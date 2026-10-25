import { ArrowBigUp, ChevronRight, CircleCheck, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Button } from '../../components/Button'
import { ErrorState } from '../../components/EmptyState'
import { TextAreaField } from '../../components/fields'
import { FormAlert } from '../../components/FormAlert'
import { ListSkeleton, Skeleton } from '../../components/Skeleton'
import { ApiError } from '../../lib/api'
import { relativeDay } from '../../lib/dates'
import { ReportButton } from '../moderation/ReportButton'
import { useAccept, useAnswer, useDeleteQa, useQaVote, useQuestion, type AnswerView, type AuthorLabel } from './api'

const authorLabels: Record<AuthorLabel, string> = { YOU: 'You', ASKER: 'The asker', STUDENT: 'A student' }

export function QuestionPage() {
  const { questionId } = useParams() as { questionId: string }
  const question = useQuestion(questionId)
  const vote = useQaVote()
  const remove = useDeleteQa()
  const navigate = useNavigate()

  if (question.isPending) {
    return (
      <>
        <Skeleton className="h-40 rounded-2xl" />
        <div className="mt-6">
          <ListSkeleton />
        </div>
      </>
    )
  }
  if (question.isError) {
    const missing = question.error instanceof ApiError && question.error.status === 404
    return <ErrorState text={missing ? 'This question does not exist or was removed.' : 'Could not load this question.'} />
  }

  const data = question.data
  const deleteQuestion = () => {
    if (!window.confirm('Delete this question and its answers?')) return
    remove.mutate({ kind: 'questions', id: data.id }, { onSuccess: () => navigate(`/courses/${data.course.id}?tab=qa`) })
  }

  return (
    <div className="mx-auto max-w-3xl">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm font-medium text-slate-500">
        <Link to={`/courses/${data.course.id}?tab=qa`} className="hover:text-slate-900">
          {data.course.code} · Q&amp;A
        </Link>
        <ChevronRight className="size-3.5" aria-hidden="true" />
        <span className="truncate text-slate-700">Question</span>
      </nav>

      <article className="card mt-4 flex gap-4 p-6">
        <VoteButton
          count={data.voteCount}
          voted={data.voted}
          label={data.title}
          onVote={(voted) => vote.mutate({ kind: 'questions', id: data.id, voted })}
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{data.title}</h1>
          <p className="mt-3 whitespace-pre-line text-slate-700">{data.body}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span>
              Asked by {data.mine ? 'you' : 'a student'} · {relativeDay(data.createdAt).toLowerCase()}
            </span>
            {data.hidden && <span className="font-semibold text-amber-700">Hidden by moderators</span>}
            {!data.mine && <ReportButton type="QUESTION" id={data.id} label={data.title} />}
            {data.canDelete && (
              <button type="button" onClick={deleteQuestion} className="inline-flex items-center gap-1 font-medium text-slate-400 hover:text-red-600">
                <Trash2 className="size-3.5" aria-hidden="true" />
                Delete
              </button>
            )}
          </div>
        </div>
      </article>

      <h2 className="mt-8 text-lg font-semibold">
        {data.answers.length} {data.answers.length === 1 ? 'answer' : 'answers'}
      </h2>
      <ul className="mt-4 space-y-3">
        {data.answers.map((answer) => (
          <AnswerCard key={answer.id} answer={answer} questionId={data.id} canAccept={data.mine} />
        ))}
      </ul>

      <AnswerForm questionId={data.id} />
    </div>
  )
}

function AnswerCard({ answer, questionId, canAccept }: { answer: AnswerView; questionId: string; canAccept: boolean }) {
  const vote = useQaVote()
  const accept = useAccept(questionId)
  const remove = useDeleteQa()

  return (
    <li className={`card flex gap-4 p-5 ${answer.accepted ? 'border-emerald-300 ring-2 ring-emerald-100' : ''}`}>
      <VoteButton
        count={answer.voteCount}
        voted={answer.voted}
        label="this answer"
        onVote={(voted) => vote.mutate({ kind: 'answers', id: answer.id, voted })}
      />
      <div className="min-w-0 flex-1">
        {answer.accepted && (
          <p className="mb-2 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            <CircleCheck className="size-3.5" aria-hidden="true" />
            Accepted answer
          </p>
        )}
        <p className="whitespace-pre-line text-slate-800">{answer.body}</p>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <span>
            {authorLabels[answer.author]} · {relativeDay(answer.createdAt).toLowerCase()}
          </span>
          {answer.hidden && <span className="font-semibold text-amber-700">Hidden by moderators</span>}
          {canAccept && (
            <button
              type="button"
              onClick={() => accept.mutate(answer.accepted ? null : answer.id)}
              className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-600"
            >
              <CircleCheck className="size-3.5" aria-hidden="true" />
              {answer.accepted ? 'Unaccept' : 'Accept this answer'}
            </button>
          )}
          {answer.author !== 'YOU' && <ReportButton type="ANSWER" id={answer.id} label="this answer" />}
          {answer.canDelete && (
            <button
              type="button"
              onClick={() => window.confirm('Delete this answer?') && remove.mutate({ kind: 'answers', id: answer.id })}
              className="inline-flex items-center gap-1 font-medium text-slate-400 hover:text-red-600"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Delete
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

function VoteButton({ count, voted, label, onVote }: { count: number; voted: boolean; label: string; onVote: (voted: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onVote(!voted)}
      aria-pressed={voted}
      aria-label={voted ? `Remove your upvote from ${label}` : `Upvote ${label}`}
      className={`flex h-16 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-sm font-bold transition active:scale-95 ${
        voted ? 'bg-indigo-600 text-white shadow-glow' : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-indigo-50 hover:text-indigo-600'
      }`}
    >
      <ArrowBigUp className={`size-6 ${voted ? 'fill-current' : ''}`} aria-hidden="true" />
      <span className="tabular-nums">{count}</span>
    </button>
  )
}

function AnswerForm({ questionId }: { questionId: string }) {
  const answer = useAnswer(questionId)
  const [body, setBody] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    answer.mutate(body.trim(), { onSuccess: () => setBody('') })
  }

  return (
    <form onSubmit={submit} className="card mt-6 space-y-4 p-6" aria-label="Your answer">
      <h2 className="font-semibold">Your answer</h2>
      {answer.isError && <FormAlert message={answer.error.message} />}
      <TextAreaField
        label="Answer"
        rows={5}
        maxLength={5000}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        hint="Posted anonymously."
      />
      <div className="flex justify-end">
        <Button type="submit" isLoading={answer.isPending} disabled={!body.trim()}>
          Post answer
        </Button>
      </div>
    </form>
  )
}
