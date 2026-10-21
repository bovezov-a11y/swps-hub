import { ArrowRight, Search, SearchX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { LinkButton } from '../../components/Button'
import { EmptyState, ErrorState } from '../../components/EmptyState'
import { ProgramIcon } from '../../components/ProgramIcon'
import { CardGridSkeleton } from '../../components/Skeleton'
import { useCourses } from '../courses/api'
import { CourseCard } from '../courses/CourseCard'
import { usePrograms } from './api'

const suggestions = ['Statistics', 'Programming', 'Psychology', 'Law', 'Marketing']

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const [search, setSearch] = useState(query)
  const [syncedQuery, setSyncedQuery] = useState(query)

  // Follow searches started elsewhere (the header search box) without fighting the user's typing.
  if (query !== syncedQuery) {
    setSyncedQuery(query)
    if (query !== search.trim()) setSearch(query)
  }

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
      <section className="relative overflow-hidden rounded-3xl bg-indigo-950 px-6 py-12 text-white sm:px-12 sm:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 right-0 size-96 rounded-full bg-indigo-500/40 blur-3xl" />
          <div className="absolute -bottom-40 left-10 size-80 rounded-full bg-fuchsia-500/25 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.07)_1px,transparent_1px)] [background-size:22px_22px]" />
        </div>
        <div className="relative max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-indigo-300 uppercase">Explore</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            Find notes and past exams for any course
          </h1>
          <p className="mt-4 text-lg text-indigo-200">
            Every program, every year, shared by SWPS students who took the course before you.
          </p>
          <div className="relative mt-8">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by course name or code…"
              aria-label="Search courses"
              className="w-full rounded-2xl border-0 bg-white py-4 pr-4 pl-12 text-base text-slate-900 shadow-2xl shadow-indigo-950/40 outline-none placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-400/50"
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-indigo-300">Try:</span>
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setSearch(suggestion)}
                className="rounded-full bg-white/10 px-3 py-1 font-medium text-indigo-100 ring-1 ring-white/15 transition hover:bg-white/20"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-10">{query ? <SearchResults query={query} /> : <ProgramGrid />}</div>
    </>
  )
}

function ProgramGrid() {
  const programs = usePrograms()

  return (
    <>
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Browse by program</h2>
          <p className="mt-1 text-sm text-slate-500">Pick your field of study to see its courses year by year.</p>
        </div>
      </div>
      <div className="mt-5">
        {programs.isPending ? (
          <CardGridSkeleton />
        ) : programs.isError ? (
          <ErrorState text="Could not load programs." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programs.data.map((program) => (
              <Link
                key={program.id}
                to={`/programs/${program.slug}`}
                className="card group flex items-center gap-4 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-card-hover"
              >
                <ProgramIcon slug={program.slug} />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-slate-900">{program.name}</span>
                  <span className="text-sm text-slate-500">
                    {program.courseCount} {program.courseCount === 1 ? 'course' : 'courses'}
                  </span>
                </span>
                <ArrowRight
                  className="size-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-500"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function SearchResults({ query }: { query: string }) {
  const courses = useCourses({ q: query, size: 30 })

  if (courses.isPending) return <CardGridSkeleton count={3} />
  if (courses.isError) return <ErrorState text="Could not search courses." />
  if (courses.data.items.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={`No courses match "${query}"`}
        text="Try another name or code, or add the course to its program so classmates can find it."
        action={<LinkButton to="/courses/new">Add a course</LinkButton>}
      />
    )
  }
  return (
    <>
      <h2 className="text-xl font-semibold tracking-tight">
        {courses.data.totalItems} {courses.data.totalItems === 1 ? 'course' : 'courses'} for “{query}”
      </h2>
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.data.items.map((course) => (
          <CourseCard key={course.id} course={course} showProgram />
        ))}
      </div>
    </>
  )
}
