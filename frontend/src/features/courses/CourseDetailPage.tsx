import { CalendarDays, Check, ChevronRight, FileText, Pencil, Plus, UserRound, Users, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Button, LinkButton } from '../../components/Button'
import { EmptyState, ErrorState } from '../../components/EmptyState'
import { ProgramIcon } from '../../components/ProgramIcon'
import { ListSkeleton, Skeleton } from '../../components/Skeleton'
import { ApiError } from '../../lib/api'
import { studyYearLabel, terms } from '../../lib/academic'
import { programIdentity } from '../../lib/program-identity'
import type { CourseDetail, CourseEvent } from '../../lib/types'
import { MaterialsSection } from '../materials/MaterialsSection'
import { useCourse, useCourseEvents, useDeleteEvent, useEnrollment } from './api'
import { EventForm } from './EventForm'
import { EventList } from './EventList'

export function CourseDetailPage() {
  const { courseId } = useParams() as { courseId: string }
  const course = useCourse(courseId)

  if (course.isPending) {
    return (
      <>
        <Skeleton className="h-56 rounded-2xl" />
        <div className="mt-8">
          <ListSkeleton />
        </div>
      </>
    )
  }
  if (course.isError) {
    const notFound = course.error instanceof ApiError && course.error.status === 404
    return <ErrorState text={notFound ? 'This course does not exist.' : 'Could not load this course.'} />
  }
  return <CourseView course={course.data} />
}

function CourseView({ course }: { course: CourseDetail }) {
  const enrollment = useEnrollment()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'schedule' ? 'schedule' : 'materials'

  const leave = () => {
    if (window.confirm(`Leave ${course.name}? Its events will disappear from your calendar.`)) {
      enrollment.mutate({ courseId: course.id, join: false })
    }
  }

  const tabs = [
    { id: 'materials', label: 'Materials', icon: FileText, count: course.materialCount },
    { id: 'schedule', label: 'Schedule', icon: CalendarDays, count: null },
  ] as const

  return (
    <>
      <section className="card overflow-hidden">
        <div aria-hidden="true" className={`h-28 bg-linear-to-r ${programIdentity(course.program.slug).gradient}`}>
          <div className="h-full bg-[radial-gradient(rgb(255_255_255/0.18)_1px,transparent_1px)] [background-size:18px_18px]" />
        </div>
        <div className="px-6 pb-6 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <ProgramIcon slug={course.program.slug} size="lg" className="-mt-8 ring-4 ring-white" />
            <div className="flex gap-3 pt-4">
              {course.canEdit && (
                <LinkButton to={`/courses/${course.id}/edit`} variant="secondary">
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </LinkButton>
              )}
              {course.enrolled ? (
                <Button variant="secondary" isLoading={enrollment.isPending} onClick={leave}>
                  <Check className="size-4 text-emerald-600" aria-hidden="true" />
                  Leave course
                </Button>
              ) : (
                <Button
                  isLoading={enrollment.isPending}
                  onClick={() => enrollment.mutate({ courseId: course.id, join: true })}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Join course
                </Button>
              )}
            </div>
          </div>

          <nav aria-label="Breadcrumb" className="mt-4 flex items-center gap-1 text-sm font-medium text-slate-500">
            <Link to="/explore" className="hover:text-slate-900">
              Explore
            </Link>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <Link to={`/programs/${course.program.slug}`} className="hover:text-slate-900">
              {course.program.name}
            </Link>
            <ChevronRight className="size-3.5" aria-hidden="true" />
            <span className="font-mono text-slate-700">{course.code}</span>
          </nav>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{course.name}</h1>

          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            <Meta icon={CalendarDays} label="When">
              {studyYearLabel(course.studyYear)} · {terms[course.term]} semester
            </Meta>
            {course.lecturer && (
              <Meta icon={UserRound} label="Lecturer">
                {course.lecturer}
              </Meta>
            )}
            <Meta icon={Users} label="Members">
              {course.memberCount} {course.memberCount === 1 ? 'member' : 'members'}
            </Meta>
          </dl>

          {course.description && (
            <p className="mt-5 max-w-3xl border-t border-slate-100 pt-5 whitespace-pre-line text-slate-700">
              {course.description}
            </p>
          )}
        </div>
      </section>

      <div className="mt-8 inline-flex rounded-xl bg-slate-200/60 p-1" role="tablist">
        {tabs.map(({ id, label, icon: Icon, count }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setSearchParams(id === 'materials' ? {} : { tab: id }, { replace: true })}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
            {count !== null && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${tab === id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-300/60 text-slate-700'}`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'materials' ? <MaterialsSection course={course} /> : <CourseSchedule course={course} />}
      </div>
    </>
  )
}

function Meta({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <dt className="sr-only">{label}</dt>
      <Icon className="size-4 text-slate-400" aria-hidden="true" />
      <dd>{children}</dd>
    </div>
  )
}

function CourseSchedule({ course }: { course: CourseDetail }) {
  const events = useCourseEvents(course.id)
  const deleteEvent = useDeleteEvent(course.id)
  const [isAdding, setIsAdding] = useState(false)
  const [showPast, setShowPast] = useState(false)
  const [now] = useState(() => Date.now())

  const upcoming = events.data?.filter((event) => new Date(event.endsAt).getTime() >= now) ?? []
  const past = events.data?.filter((event) => new Date(event.endsAt).getTime() < now).reverse() ?? []
  const shown = showPast ? past : upcoming

  const remove = (event: CourseEvent) => {
    if (window.confirm(`Delete "${event.title}"? It will be removed for everyone in the course.`)) {
      deleteEvent.mutate(event.id)
    }
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2" role="group" aria-label="Show events">
          {[false, true].map((past) => (
            <button
              key={String(past)}
              type="button"
              aria-pressed={showPast === past}
              onClick={() => setShowPast(past)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                showPast === past
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-700 shadow-xs ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {past ? 'Past' : 'Upcoming'}
            </button>
          ))}
        </div>
        {course.enrolled && !isAdding && (
          <Button onClick={() => setIsAdding(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Add event
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="mt-5">
          <EventForm courseId={course.id} onDone={() => setIsAdding(false)} />
        </div>
      )}

      <div className="mt-6">
        {events.isPending ? (
          <ListSkeleton />
        ) : events.isError ? (
          <ErrorState text="Could not load the schedule." />
        ) : shown.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={showPast ? 'No past events' : 'Nothing scheduled yet'}
            text={
              showPast
                ? 'Events will appear here once they are over.'
                : course.enrolled
                  ? 'Add lectures, classes, exams and deadlines so everyone in the course stays in sync.'
                  : 'Join the course to add lectures, exams and deadlines.'
            }
          />
        ) : (
          <EventList events={shown} onDelete={remove} />
        )}
      </div>
    </section>
  )
}
