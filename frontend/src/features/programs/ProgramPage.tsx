import { ArrowLeft, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { LinkButton } from '../../components/Button'
import { EmptyState, ErrorState } from '../../components/EmptyState'
import { ProgramIcon } from '../../components/ProgramIcon'
import { CardGridSkeleton, Skeleton } from '../../components/Skeleton'
import { ApiError } from '../../lib/api'
import { studyYearLabel, termOrder } from '../../lib/academic'
import { programIdentity } from '../../lib/program-identity'
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

  if (programs.isPending || courses.isPending) {
    return (
      <>
        <Skeleton className="h-40 rounded-3xl" />
        <div className="mt-8">
          <CardGridSkeleton />
        </div>
      </>
    )
  }
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
  const materialCount = courses.data.items.reduce((sum, course) => sum + course.materialCount, 0)

  return (
    <>
      <section className="card relative overflow-hidden">
        <div aria-hidden="true" className={`h-24 bg-linear-to-r opacity-90 ${programIdentity(program.slug).gradient}`}>
          <div className="h-full bg-[radial-gradient(rgb(255_255_255/0.18)_1px,transparent_1px)] [background-size:18px_18px]" />
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4 px-6 pb-6 sm:px-8">
          <div className="flex items-end gap-4">
            <ProgramIcon slug={program.slug} size="lg" className="-mt-8 ring-4 ring-white" />
            <div>
              <Link to="/explore" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900">
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                All programs
              </Link>
              <h1 className="text-3xl font-semibold tracking-tight">{program.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <dl className="flex gap-6 text-sm">
              <div>
                <dt className="text-slate-500">Courses</dt>
                <dd className="text-lg font-semibold">{program.courseCount}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Shared files</dt>
                <dd className="text-lg font-semibold">{materialCount}</dd>
              </div>
            </dl>
            <LinkButton to={`/courses/new?program=${program.slug}`}>
              <Plus className="size-4" aria-hidden="true" />
              Add a course
            </LinkButton>
          </div>
        </div>
      </section>

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
            <div className="relative sm:ml-auto sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder={`Filter ${program.name} courses`}
                aria-label="Filter courses"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm shadow-xs outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="mt-8 space-y-10">
            {groupByYear(visible).map(([studyYear, list]) => (
              <section key={studyYear}>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">{studyYearLabel(studyYear)}</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {list.length}
                  </span>
                  <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        active
          ? 'bg-slate-900 text-white shadow-sm'
          : 'bg-white text-slate-700 shadow-xs ring-1 ring-slate-200 hover:bg-slate-50'
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
