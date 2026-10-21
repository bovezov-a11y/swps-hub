import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { LinkButton } from '../../components/Button'
import { EmptyState, ErrorState } from '../../components/EmptyState'
import { Spinner } from '../../components/Spinner'
import { useCourses } from '../courses/api'
import { CourseCard } from '../courses/CourseCard'
import { usePrograms } from './api'

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [search, setSearch] = useState(query)

  // The search text lives in the URL so results survive reloads and the back button.
  useEffect(() => {
    if (search.trim() === query) return
    const timer = setTimeout(() => {
      setSearchParams(search.trim() ? { q: search.trim() } : {}, { replace: true })
    }, 300)
    return () => clearTimeout(timer)
  }, [search, query, setSearchParams])

  return (
    <>
      <div className="rounded-3xl bg-indigo-950 px-6 py-10 text-white sm:px-10">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Explore courses</h1>
        <p className="mt-2 max-w-xl text-indigo-200">
          Notes, summaries and past exams for every program and year, shared by SWPS students.
        </p>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search any course by name or code, e.g. Statistics"
          aria-label="Search courses"
          className="mt-6 w-full max-w-xl rounded-xl border-0 bg-white px-4 py-3 text-slate-900 shadow-lg outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-400/50"
        />
      </div>

      <div className="mt-10">{query ? <SearchResults query={query} /> : <ProgramGrid />}</div>
    </>
  )
}

function ProgramGrid() {
  const programs = usePrograms()

  if (programs.isPending) return <CenteredSpinner />
  if (programs.isError) return <ErrorState text="Could not load programs." />

  return (
    <>
      <h2 className="text-lg font-semibold">Programs</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {programs.data.map((program) => (
          <Link
            key={program.id}
            to={`/programs/${program.slug}`}
            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-indigo-300 hover:shadow-md"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-700 transition group-hover:bg-indigo-600 group-hover:text-white">
              {program.name[0]}
            </span>
            <span className="min-w-0">
              <span className="block font-semibold text-slate-900">{program.name}</span>
              <span className="text-sm text-slate-500">
                {program.courseCount} {program.courseCount === 1 ? 'course' : 'courses'}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </>
  )
}

function SearchResults({ query }: { query: string }) {
  const courses = useCourses({ q: query, size: 30 })

  if (courses.isPending) return <CenteredSpinner />
  if (courses.isError) return <ErrorState text="Could not search courses." />
  if (courses.data.items.length === 0) {
    return (
      <EmptyState
        title={`No courses match "${query}"`}
        text="Try another name or code, or add the course to its program so classmates can find it."
        action={<LinkButton to="/courses/new">Add a course</LinkButton>}
      />
    )
  }
  return (
    <>
      <h2 className="text-lg font-semibold">
        {courses.data.totalItems} {courses.data.totalItems === 1 ? 'course' : 'courses'} found
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.data.items.map((course) => (
          <CourseCard key={course.id} course={course} showProgram />
        ))}
      </div>
    </>
  )
}

function CenteredSpinner() {
  return (
    <div className="flex justify-center py-16 text-indigo-600">
      <Spinner />
    </div>
  )
}
