import { Check, FileText, Users } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { ProgramIcon } from '../../components/ProgramIcon'
import { studyYearLabel, terms } from '../../lib/academic'
import type { CourseSummary } from '../../lib/types'
import { useEnrollment } from './api'

export function CourseCard({ course, showProgram = false }: { course: CourseSummary; showProgram?: boolean }) {
  const enrollment = useEnrollment()

  return (
    <article className="card group relative flex flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-card-hover">
      <div className="flex items-center gap-3">
        <ProgramIcon slug={course.program.slug} size="sm" />
        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
          {course.code}
        </span>
        <span className="ml-auto text-xs font-medium text-slate-500">
          {studyYearLabel(course.studyYear)} · {terms[course.term]}
        </span>
      </div>
      <h3 className="mt-4 line-clamp-2 font-semibold text-slate-900 group-hover:text-indigo-700">
        {/* The link covers the whole card; the join button sits above it. */}
        <Link to={`/courses/${course.id}`} className="after:absolute after:inset-0 after:rounded-2xl">
          {course.name}
        </Link>
      </h3>
      <p className="mt-1 mb-5 truncate text-sm text-slate-500">
        {showProgram ? course.program.name : (course.lecturer ?? 'Lecturer not set')}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <span className="flex items-center gap-4 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5" title="Shared materials">
            <FileText className="size-4 text-slate-400" aria-hidden="true" />
            {course.materialCount} {course.materialCount === 1 ? 'file' : 'files'}
          </span>
          <span className="inline-flex items-center gap-1.5" title="Members">
            <Users className="size-4 text-slate-400" aria-hidden="true" />
            {course.memberCount}
          </span>
        </span>
        {course.enrolled ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            <Check className="size-3.5" aria-hidden="true" />
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
