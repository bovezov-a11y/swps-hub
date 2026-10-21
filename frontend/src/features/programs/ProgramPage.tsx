import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { LinkButton } from '../../components/Button'
import { EmptyState, ErrorState } from '../../components/EmptyState'
import { FullPageSpinner } from '../../components/Spinner'
import { ApiError } from '../../lib/api'
import { studyYearLabel, termOrder } from '../../lib/academic'
import type { CourseSummary } from '../../lib/types'
import { useCourses } from '../courses/api'
import { CourseCard } from '../courses/CourseCard'
import { usePrograms } from './api'

export function ProgramPage() {
  const { slug } = useParams() as { slug: string }
  const programs = usePrograms()
  const courses = useCourses({ program: slug, size: 100 })
  const [year, setYear] = useState<number | null>(null)
  const [filter, setFilter] = useState('')

  if (programs.isPending || courses.isPending) return <FullPageSpinner />
  const program = programs.data?.find((candidate) => candidate.slug === slug)
  if (!program || courses.isError) {
    const notFound = !program || (courses.error instanceof ApiError && courses.error.status === 404)
    return <ErrorState text={notFound ? 'This program does not exist.' : 'Could not load this program.'} />
  }

  const text = filter.trim().toLowerCase()
  const visible = courses.data.items.filter(
    (course) =>
      (year === null || course.studyYear === year) &&
      (!text || course.name.toLowerCase().includes(text) || course.code.toLowerCase().includes(text)),
  )
  const years = [...new Set(courses.data.items.map((course) => course.studyYear))].sort()

  return (
    <>
      <Link to="/explore" className="text-sm font-medium text-slate-500 hover:text-slate-900">
        ← All programs
      </Link>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{program.name}</h1>
          <p className="mt-2 text-slate-600">
            {program.courseCount} {program.courseCount === 1 ? 'course' : 'courses'} with notes, summaries and past
            exams shared by students.
          </p>
        </div>
        <LinkButton to={`/courses/new?program=${program.slug}`}>Add a course</LinkButton>
      </div>

      {courses.data.items.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No courses yet"
            text={`Be the first to add a ${program.name} course. Your classmates can then join it and share materials.`}
            action={<LinkButton to={`/courses/new?program=${program.slug}`}>Add a course</LinkButton>}
          />
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Year of study">
              <YearChip active={year === null} onClick={() => setYear(null)}>
                All years
              </YearChip>
              {years.map((value) => (
                <YearChip key={value} active={year === value} onClick={() => setYear(value)}>
                  {studyYearLabel(value)}
                </YearChip>
              ))}
            </div>
            <input
              type="search"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder={`Filter ${program.name} courses`}
              aria-label="Filter courses"
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm shadow-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:ml-auto sm:w-72"
            />
          </div>

          <div className="mt-6 space-y-10">
            {groupByYear(visible).map(([studyYear, list]) => (
              <section key={studyYear}>
                <h2 className="text-lg font-semibold">{studyYearLabel(studyYear)}</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </section>
            ))}
            {visible.length === 0 && <p className="text-sm text-slate-500">No courses match your filters.</p>}
          </div>
        </>
      )}
    </>
  )
}

function YearChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
        active ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}

function groupByYear(courses: CourseSummary[]) {
  const groups = new Map<number, CourseSummary[]>()
  for (const course of courses) {
    groups.set(course.studyYear, [...(groups.get(course.studyYear) ?? []), course])
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(
      ([year, list]) =>
        [
          year,
          list.sort(
            (a, b) => termOrder.indexOf(a.term) - termOrder.indexOf(b.term) || a.name.localeCompare(b.name),
          ),
        ] as const,
    )
}
