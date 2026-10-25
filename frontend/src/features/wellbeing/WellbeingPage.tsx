import { CalendarPlus, Check, HeartHandshake, Pause, Phone, Play, RotateCcw, Timer, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/Button'
import { EmptyState, ErrorState } from '../../components/EmptyState'
import { EventTypeBadge } from '../../components/EventTypeBadge'
import { HeatLegend } from '../../components/HeatLegend'
import { Skeleton } from '../../components/Skeleton'
import { supportResources } from '../../content/support-resources'
import { formatShortDay } from '../../lib/dates'
import { heatClass } from '../../lib/heat'
import { useCreateStudyPlan, useWorkload, type Workload, type WorkloadAssessment } from './api'

const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
const monthLabel = new Intl.DateTimeFormat('en-GB', { month: 'short' })

/** Workload overview, study planning, a focus timer and where to get support. Nothing here is shared or stored. */
export function WellbeingPage() {
  const workload = useWorkload()

  return (
    <>
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
          <HeartHandshake className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Study & wellbeing</h1>
          <p className="mt-1 max-w-2xl text-slate-600">
            See heavy weeks coming, spread your revision, and take breaks. Only you can see this page.
          </p>
        </div>
      </div>

      {workload.isPending ? (
        <Skeleton className="mt-8 h-64 rounded-2xl" />
      ) : workload.isError ? (
        <div className="mt-8">
          <ErrorState text="Could not load your workload." />
        </div>
      ) : (
        <>
          <Crunches workload={workload.data} />
          <section className="card mt-6 p-6">
            <h2 className="font-semibold">Your exams and deadlines</h2>
            <p className="mt-1 text-sm text-slate-500">The next 16 weeks across every course you joined.</p>
            <WorkloadHeatmap workload={workload.data} />
          </section>
        </>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <FocusTimer />
        <SupportCard />
      </div>
    </>
  )
}

function Crunches({ workload }: { workload: Workload }) {
  if (workload.crunches.length === 0) {
    return (
      <div className="mt-8 flex items-center gap-3 rounded-2xl bg-emerald-50 px-5 py-4 text-emerald-900 ring-1 ring-emerald-600/20">
        <Check className="size-5 shrink-0" aria-hidden="true" />
        <p className="text-sm">
          No crunch weeks ahead: you never have {workload.crunchAssessments} or more exams or deadlines within{' '}
          {workload.crunchDays} days. Keep it steady.
        </p>
      </div>
    )
  }
  return (
    <div className="mt-8 space-y-4">
      {workload.crunches.map((crunch) => (
        <section key={crunch.from} className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-600/20">
          <h2 className="flex items-center gap-2 font-semibold text-amber-950">
            <TriangleAlert className="size-5" aria-hidden="true" />
            Busy stretch: {crunch.assessments.length} exams and deadlines between{' '}
            {longDate.format(new Date(crunch.from))} and {longDate.format(new Date(crunch.to))}
          </h2>
          <p className="mt-1 text-sm text-amber-900">
            Starting early beats cramming. Plan short sessions before each one; they go straight into your calendar.
          </p>
          <ul className="mt-4 space-y-2">
            {crunch.assessments.map((assessment) => (
              <AssessmentRow key={assessment.eventId} assessment={assessment} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function AssessmentRow({ assessment }: { assessment: WorkloadAssessment }) {
  const plan = useCreateStudyPlan()
  const planned = assessment.planned || plan.isSuccess
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-xs">
      <EventTypeBadge type={assessment.type} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{assessment.title}</span>
        <span className="text-xs text-slate-500">
          {assessment.courseCode} · {formatShortDay(new Date(assessment.startsAt))}
        </span>
      </span>
      {planned ? (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
          <Check className="size-4" aria-hidden="true" />
          Sessions planned
        </span>
      ) : (
        <Button size="sm" variant="secondary" isLoading={plan.isPending} onClick={() => plan.mutate(assessment.eventId)}>
          <CalendarPlus className="size-3.5" aria-hidden="true" />
          Plan study sessions
        </Button>
      )}
      {plan.isError && <p className="w-full text-sm text-red-600">{plan.error.message}</p>}
    </li>
  )
}

/** Weeks as columns and weekdays as rows, like a contribution graph. */
function WorkloadHeatmap({ workload }: { workload: Workload }) {
  const weeks: Workload['days'][] = []
  for (let index = 0; index < workload.days.length; index += 7) {
    weeks.push(workload.days.slice(index, index + 7))
  }
  if (workload.days.every((day) => day.count === 0)) {
    return (
      <div className="mt-5">
        <EmptyState
          title="Nothing scheduled yet"
          text="Exams and deadlines from your courses will show up here as soon as someone adds them."
        />
      </div>
    )
  }
  return (
    <div className="mt-5 overflow-x-auto">
      <div className="inline-flex gap-1">
        <div className="mr-1 flex flex-col gap-1 pt-5 text-[10px] text-slate-500" aria-hidden="true">
          {['Mon', '', 'Wed', '', 'Fri', '', 'Sun'].map((label, index) => (
            <span key={index} className="flex h-5 items-center">
              {label}
            </span>
          ))}
        </div>
        {weeks.map((week) => {
          const first = new Date(week[0]!.date)
          return (
            <div key={week[0]!.date} className="flex flex-col gap-1">
              <span className="h-4 text-[10px] text-slate-500">
                {first.getDate() <= 7 ? monthLabel.format(first) : ''}
              </span>
              {week.map((day) => {
                const label = `${longDate.format(new Date(day.date))}: ${
                  day.count === 0 ? 'nothing due' : day.assessments.map((item) => `${item.courseCode} ${item.title}`).join(', ')
                }`
                return (
                  <div
                    key={day.date}
                    title={label}
                    aria-label={label}
                    className={`flex size-5 items-center justify-center rounded text-[10px] font-semibold ${heatClass(day.count)}`}
                  >
                    {day.count > 1 ? day.count : ''}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      <HeatLegend />
    </div>
  )
}

const FOCUS_MINUTES = 25
const BREAK_MINUTES = 5

/** A Pomodoro timer: 25 minutes of focus, then a 5 minute break. Runs only in this browser tab. */
function FocusTimer() {
  const [phase, setPhase] = useState<'focus' | 'break'>('focus')
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_MINUTES * 60)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(0)

  useEffect(() => {
    if (!running) return
    const timer = setInterval(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => clearInterval(timer)
  }, [running])

  if (running && secondsLeft === 0) {
    const nextPhase = phase === 'focus' ? 'break' : 'focus'
    if (phase === 'focus') setCompleted(completed + 1)
    setPhase(nextPhase)
    setSecondsLeft((nextPhase === 'focus' ? FOCUS_MINUTES : BREAK_MINUTES) * 60)
  }

  const total = (phase === 'focus' ? FOCUS_MINUTES : BREAK_MINUTES) * 60
  const progress = 1 - secondsLeft / total
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const seconds = String(secondsLeft % 60).padStart(2, '0')
  const reset = () => {
    setRunning(false)
    setPhase('focus')
    setSecondsLeft(FOCUS_MINUTES * 60)
  }

  return (
    <section className="card p-6">
      <h2 className="flex items-center gap-2 font-semibold">
        <Timer className="size-4.5 text-indigo-500" aria-hidden="true" />
        Focus timer
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        {FOCUS_MINUTES} minutes of focus, then a {BREAK_MINUTES} minute break. Short breaks keep you sharper for longer.
      </p>
      <div className="mt-6 flex flex-col items-center">
        <div className="relative size-44">
          <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
            <circle cx="50" cy="50" r="44" fill="none" strokeWidth="6" className="stroke-slate-100" />
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - progress)}
              className={phase === 'focus' ? 'stroke-indigo-500 transition-all' : 'stroke-teal-500 transition-all'}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center" role="timer" aria-live="off">
            <span className="text-4xl font-semibold tabular-nums">
              {minutes}:{seconds}
            </span>
            <span className={`text-sm font-medium ${phase === 'focus' ? 'text-indigo-600' : 'text-teal-600'}`}>
              {phase === 'focus' ? 'Focus' : 'Break'}
            </span>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <Button onClick={() => setRunning(!running)}>
            {running ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
            {running ? 'Pause' : 'Start'}
          </Button>
          <Button variant="secondary" onClick={reset} aria-label="Reset timer">
            <RotateCcw className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          {completed} focus {completed === 1 ? 'session' : 'sessions'} completed
        </p>
      </div>
    </section>
  )
}

function SupportCard() {
  return (
    <section className="card p-6">
      <h2 className="flex items-center gap-2 font-semibold">
        <HeartHandshake className="size-4.5 text-teal-600" aria-hidden="true" />
        Feeling overwhelmed?
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Exam periods are hard for everyone. Talking to someone helps, and these lines are free.
      </p>
      <ul className="mt-4 space-y-3">
        {supportResources.map((resource) => (
          <li key={resource.phone} className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-teal-600 ring-1 ring-slate-200">
              <Phone className="size-4" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <a href={`tel:${resource.phone.replace(/\s/g, '')}`} className="font-semibold text-slate-900 hover:text-teal-700">
                {resource.phone}
              </a>
              <span className="block text-sm text-slate-700">{resource.name}</span>
              <span className="block text-xs text-slate-500">{resource.note}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-slate-500">
        Your university also offers psychological support for students; ask your dean’s office or student services
        how to book it.
      </p>
    </section>
  )
}
