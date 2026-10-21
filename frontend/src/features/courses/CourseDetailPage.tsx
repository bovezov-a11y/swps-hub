import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { Button, LinkButton } from '../../components/Button'
import { EmptyState, ErrorState } from '../../components/EmptyState'
import { FullPageSpinner, Spinner } from '../../components/Spinner'
import { ApiError } from '../../lib/api'
import { studyYearLabel, terms } from '../../lib/academic'
import type { CourseDetail, CourseEvent } from '../../lib/types'
import { MaterialsSection } from '../materials/MaterialsSection'
import { useCourse, useCourseEvents, useDeleteEvent, useEnrollment } from './api'
import { EventForm } from './EventForm'
import { EventList } from './EventList'

export function CourseDetailPage() {
  const { courseId } = useParams() as { courseId: string }
  const course = useCourse(courseId)

  if (course.isPending) return <FullPageSpinner />
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
    { id: 'materials', label: 'Materials', count: course.materialCount },
    { id: 'schedule', label: 'Schedule', count: null },
  ] as const

  return (
    <>
      <nav aria-label="Breadcrumb" className="text-sm font-medium text-slate-500">
        <Link to="/explore" className="hover:text-slate-900">
          Explore
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <Link to={`/programs/${course.program.slug}`} className="hover:text-slate-900">
          {course.program.name}
        </Link>
      </nav>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span className="rounded-md bg-indigo-50 px-2 py-1 font-mono text-xs font-semibold text-indigo-700">
              {course.code}
            </span>
            <span>
              {studyYearLabel(course.studyYear)} · {terms[course.term]}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {course.memberCount} {course.memberCount === 1 ? 'member' : 'members'}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">{course.name}</h1>
          {course.lecturer && <p className="mt-1 text-slate-600">{course.lecturer}</p>}
        </div>
        <div className="flex gap-3">
          {course.canEdit && (
            <LinkButton to={`/courses/${course.id}/edit`} variant="secondary">
              Edit
            </LinkButton>
          )}
          {course.enrolled ? (
            <Button variant="secondary" isLoading={enrollment.isPending} onClick={leave}>
              Leave course
            </Button>
          ) : (
            <Button isLoading={enrollment.isPending} onClick={() => enrollment.mutate({ courseId: course.id, join: true })}>
              Join course
            </Button>
          )}
        </div>
      </header>

      {course.description && (
        <p className="mt-6 max-w-3xl whitespace-pre-line text-slate-700">{course.description}</p>
      )}

      <div className="mt-10 border-b border-slate-200" role="tablist">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setSearchParams(item.id === 'materials' ? {} : { tab: item.id }, { replace: true })}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              tab === item.id
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {item.label}
            {item.count !== null && (
              <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{item.count}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">{tab === 'materials' ? <MaterialsSection course={course} /> : <CourseSchedule course={course} />}</div>
    </>
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
        <div className="inline-flex rounded-lg bg-slate-200/60 p-1 text-sm" role="group" aria-label="Show events">
          {[false, true].map((past) => (
            <button
              key={String(past)}
              type="button"
              aria-pressed={showPast === past}
              onClick={() => setShowPast(past)}
              className={`rounded-md px-3 py-1 font-medium transition ${
                showPast === past ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {past ? 'Past' : 'Upcoming'}
            </button>
          ))}
        </div>
        {course.enrolled && !isAdding && <Button onClick={() => setIsAdding(true)}>Add event</Button>}
      </div>

      {isAdding && (
        <div className="mt-5">
          <EventForm courseId={course.id} onDone={() => setIsAdding(false)} />
        </div>
      )}

      <div className="mt-6">
        {events.isPending ? (
          <div className="flex justify-center py-10 text-indigo-600">
            <Spinner />
          </div>
        ) : events.isError ? (
          <ErrorState text="Could not load the schedule." />
        ) : shown.length === 0 ? (
          <EmptyState
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
