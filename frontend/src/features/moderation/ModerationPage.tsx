import { EyeOff, History, RotateCcw, ShieldCheck, Trash2, UserPlus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { EmptyState, ErrorState } from '../../components/EmptyState'
import { TextField } from '../../components/fields'
import { FormAlert } from '../../components/FormAlert'
import { ListSkeleton } from '../../components/Skeleton'
import { ApiError } from '../../lib/api'
import { relativeDay } from '../../lib/dates'
import type { ReportReason } from '../../lib/types'
import { useAuth } from '../auth/auth-context'
import {
  reportReasons,
  useAddModerator,
  useModerationAction,
  useModerationLog,
  useModerationQueue,
  useModerators,
  useRemoveModerator,
  type QueueItem,
} from './api'

const typeLabels = { MATERIAL: 'File', QUESTION: 'Question', ANSWER: 'Answer' }

export function ModerationPage() {
  const { user } = useAuth()
  const queue = useModerationQueue()

  return (
    <>
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
          <ShieldCheck className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Moderation</h1>
          <p className="mt-1 text-slate-600">
            Review what students reported. Reports are anonymous, and so are the people who posted the content.
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Reported content</h2>
        <div className="mt-4">
          {queue.isPending ? (
            <ListSkeleton />
          ) : queue.isError ? (
            <ErrorState text="Could not load the moderation queue." />
          ) : queue.data.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="Nothing to review" text="No open reports right now. Nice and quiet." />
          ) : (
            <ul className="space-y-3">
              {queue.data.map((item) => (
                <QueueCard key={`${item.type}:${item.id}`} item={item} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ActivityLog />
        {user?.role === 'ADMIN' && <Moderators />}
      </div>
    </>
  )
}

function QueueCard({ item }: { item: QueueItem }) {
  const action = useModerationAction()
  const run = (kind: 'hide' | 'restore' | 'delete') => {
    if (kind === 'delete' && !window.confirm(`Delete "${item.content.title}" for good?`)) return
    action.mutate({ type: item.type, id: item.id, action: kind })
  }

  return (
    <li className="card p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">{typeLabels[item.type]}</span>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-slate-700">{item.content.courseCode}</span>
        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-amber-800 ring-1 ring-amber-600/20 ring-inset">
          {item.reportCount} {item.reportCount === 1 ? 'report' : 'reports'}
        </span>
        {item.content.hidden && (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5 text-white">
            <EyeOff className="size-3" aria-hidden="true" />
            Hidden
          </span>
        )}
        <span className="font-normal text-slate-500">first reported {relativeDay(item.firstReportedAt).toLowerCase()}</span>
      </div>
      <h3 className="mt-2 font-semibold">
        <Link to={item.content.link} className="hover:text-indigo-600">
          {item.content.title}
        </Link>
      </h3>
      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.content.excerpt}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(Object.entries(item.reasons) as [ReportReason, number][]).map(([reason, count]) => (
          <span key={reason} className="rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-700 ring-1 ring-slate-200">
            {reportReasons[reason]} · {count}
          </span>
        ))}
      </div>
      {item.details.length > 0 && (
        <ul className="mt-3 space-y-1 border-l-2 border-slate-200 pl-3 text-sm text-slate-600">
          {item.details.map((detail) => (
            <li key={detail}>“{detail}”</li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {item.content.hidden ? (
          <Button size="sm" variant="secondary" onClick={() => run('restore')} isLoading={action.isPending}>
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Restore and dismiss
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => run('hide')} isLoading={action.isPending}>
            <EyeOff className="size-3.5" aria-hidden="true" />
            Hide
          </Button>
        )}
        {!item.content.hidden && (
          <Button size="sm" variant="ghost" onClick={() => run('restore')}>
            Dismiss reports
          </Button>
        )}
        <Button size="sm" variant="danger" onClick={() => run('delete')}>
          <Trash2 className="size-3.5" aria-hidden="true" />
          Delete
        </Button>
      </div>
    </li>
  )
}

const actionLabels = { AUTO_HIDE: 'Hidden automatically', HIDE: 'Hidden', RESTORE: 'Restored', DELETE: 'Deleted' }

function ActivityLog() {
  const log = useModerationLog()
  return (
    <section className="card p-6">
      <h2 className="flex items-center gap-2 font-semibold">
        <History className="size-4.5 text-indigo-500" aria-hidden="true" />
        Recent decisions
      </h2>
      <div className="mt-4">
        {log.isPending ? (
          <ListSkeleton count={2} />
        ) : log.isError ? (
          <ErrorState text="Could not load the log." />
        ) : log.data.length === 0 ? (
          <p className="text-sm text-slate-500">No moderation decisions yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {log.data.map((entry) => (
              <li key={`${entry.at}-${entry.summary}`} className="py-2.5 text-sm">
                <span className="font-semibold">{actionLabels[entry.action]}</span>{' '}
                <span className="text-slate-700">{entry.summary}</span>
                <span className="block text-xs text-slate-500">
                  {entry.moderator} · {relativeDay(entry.at).toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function Moderators() {
  const moderators = useModerators()
  const add = useAddModerator()
  const remove = useRemoveModerator()
  const [email, setEmail] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    add.mutate(email.trim(), { onSuccess: () => setEmail('') })
  }

  return (
    <section className="card p-6">
      <h2 className="flex items-center gap-2 font-semibold">
        <UserPlus className="size-4.5 text-indigo-500" aria-hidden="true" />
        Moderators
      </h2>
      <form onSubmit={submit} className="mt-4 flex items-end gap-2">
        <TextField
          label="Add by university email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@st.swps.edu.pl"
          className="flex-1"
        />
        <Button type="submit" isLoading={add.isPending} disabled={!email.includes('@')}>
          Add
        </Button>
      </form>
      {add.isError && (
        <div className="mt-3">
          <FormAlert
            message={add.error instanceof ApiError ? (Object.values(add.error.fieldErrors)[0] ?? add.error.message) : add.error.message}
          />
        </div>
      )}
      <ul className="mt-4 divide-y divide-slate-100">
        {moderators.data?.map((member) => (
          <li key={member.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <span className="min-w-0">
              <span className="block truncate font-medium">{member.displayName}</span>
              <span className="block truncate text-xs text-slate-500">{member.email}</span>
            </span>
            {member.role === 'ADMIN' ? (
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">Admin</span>
            ) : (
              <button
                type="button"
                onClick={() => remove.mutate(member.id)}
                aria-label={`Remove ${member.displayName} as moderator`}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
