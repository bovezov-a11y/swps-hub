import { useState } from 'react'
import { Button } from '../../components/Button'
import { Spinner } from '../../components/Spinner'
import { useCalendarFeed, useResetCalendarFeed } from './api'

export function SubscribeCard() {
  const feed = useCalendarFeed()
  const resetFeed = useResetCalendarFeed()
  const [copied, setCopied] = useState(false)

  const url = feed.data ? `${window.location.origin}${feed.data.path}` : ''

  const copy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    if (window.confirm('Create a new link? Calendars subscribed with the old link will stop updating.')) {
      resetFeed.mutate()
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      <h2 className="font-semibold">Sync with your calendar</h2>
      <p className="mt-1.5 text-sm text-slate-600">
        Subscribe in Google Calendar, Apple Calendar or Outlook to see your classes and exams there. It updates
        automatically.
      </p>

      {feed.isPending ? (
        <div className="mt-5 flex justify-center text-indigo-600">
          <Spinner className="size-5" />
        </div>
      ) : feed.isError ? (
        <p className="mt-5 text-sm text-red-600">Could not load your calendar link.</p>
      ) : (
        <>
          <div className="mt-5 flex gap-2">
            <input
              readOnly
              value={url}
              aria-label="Calendar subscription link"
              onFocus={(event) => event.target.select()}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600"
            />
            <Button variant="secondary" size="sm" onClick={copy}>
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <a
              href={url.replace(/^https?:/, 'webcal:')}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Open in calendar app →
            </a>
            <button
              type="button"
              onClick={reset}
              disabled={resetFeed.isPending}
              className="text-sm text-slate-500 hover:text-slate-900 disabled:opacity-60"
            >
              Reset link
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-500">Keep this link private: anyone who has it can see your schedule.</p>
        </>
      )}
    </section>
  )
}
