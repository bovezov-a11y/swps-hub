import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { studyYearLabel, terms } from '../../lib/academic'
import type { CourseSummary } from '../../lib/types'
import { useEnrollment } from './api'

export function CourseCard({ course, showProgram = false }: { course: CourseSummary; showProgram?: boolean }) {
  const enrollment = useEnrollment()

  return (
    <article className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-md bg-indigo-50 px-2 py-1 font-mono text-xs font-semibold text-indigo-700">
          {course.code}
        </span>
        <span className="text-right text-xs text-slate-500">
          {studyYearLabel(course.studyYear)} · {terms[course.term]}
        </span>
      </div>
      <h3 className="mt-3 font-semibold text-slate-900">
        {/* The link covers the whole card; the join button sits above it. */}
        <Link to={`/courses/${course.id}`} className="after:absolute after:inset-0 after:rounded-2xl">
          {course.name}
        </Link>
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        {showProgram ? course.program.name : (course.lecturer ?? 'Lecturer not set')}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className="flex gap-3 text-sm text-slate-500">
          <span title="Shared materials">
            {course.materialCount} {course.materialCount === 1 ? 'file' : 'files'}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {course.memberCount} {course.memberCount === 1 ? 'member' : 'members'}
          </span>
        </span>
        {course.enrolled ? (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
            <svg viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.58l7.3-7.3a1 1 0 0 1 1.4 0Z"
                clipRule="evenodd"
              />
            </svg>
            Joined
          </span>
        ) : (
          <Button
            size="sm"
            className="relative z-10"
            isLoading={enrollment.isPending}
            onClick={() => enrollment.mutate({ courseId: course.id, join: true })}
            aria-label={`Join ${course.name}`}
          >
            Join
          </Button>
        )}
      </div>
    </article>
  )
}
