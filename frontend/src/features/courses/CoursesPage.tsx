import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Button, LinkButton } from '../../components/Button'
import { EmptyState, ErrorState } from '../../components/EmptyState'
import { Spinner } from '../../components/Spinner'
import { semesterOptions } from '../../lib/semesters'
import { useCourses, type CourseFilters } from './api'
import { CourseCard } from './CourseCard'

export function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  // Filters live in the URL so a filtered list can be bookmarked, shared and restored with the back button.
  const filters: CourseFilters = {
    q: searchParams.get('q') ?? '',
    semester: searchParams.get('semester') ?? '',
    mine: searchParams.get('mine') === 'true',
    page: Number(searchParams.get('page') ?? 0),
  }
  const courses = useCourses(filters)
  const [search, setSearch] = useState(filters.q)

  const updateFilters = (changes: Record<string, string | null>) =>
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        return next
      },
      { replace: true },
    )

  useEffect(() => {
    if (search === (searchParams.get('q') ?? '')) return
    const timer = setTimeout(() => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          if (search) next.set('q', search)
          else next.delete('q')
          next.delete('page')
          return next
        },
        { replace: true },
      )
    }, 300)
    return () => clearTimeout(timer)
  }, [search, searchParams, setSearchParams])

  const tabs = [
    { label: 'All courses', mine: false },
    { label: 'My courses', mine: true },
  ]

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Courses</h1>
          <p className="mt-2 text-slate-600">Find your courses and join them to build your timetable.</p>
        </div>
        <LinkButton to="/courses/new">New course</LinkButton>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="inline-flex rounded-lg bg-slate-200/60 p-1" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={filters.mine === tab.mine}
              onClick={() => updateFilters({ mine: tab.mine ? 'true' : null, page: null })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                filters.mine === tab.mine ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search by name or code"
          aria-label="Search courses"
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm shadow-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:max-w-xs"
        />
        <select
          value={filters.semester}
          onChange={(event) => updateFilters({ semester: event.target.value, page: null })}
          aria-label="Semester"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
        >
          <option value="">All semesters</option>
          {semesterOptions().map((semester) => (
            <option key={semester}>{semester}</option>
          ))}
        </select>
        {courses.isFetching && <Spinner className="size-5 text-indigo-600" />}
      </div>

      <div className="mt-6">
        {courses.isPending ? (
          <div className="flex justify-center py-16 text-indigo-600">
            <Spinner />
          </div>
        ) : courses.isError ? (
          <ErrorState text="Could not load courses. Please try again." />
        ) : courses.data.items.length === 0 ? (
          <EmptyState
            title={filters.mine ? 'You have not joined any courses yet' : 'No courses found'}
            text={
              filters.mine
                ? 'Browse all courses and join the ones you take this semester.'
                : 'Is your course missing? Add it so your classmates can join too.'
            }
            action={
              filters.mine ? (
                <Button variant="secondary" onClick={() => updateFilters({ mine: null, page: null })}>
                  Browse all courses
                </Button>
              ) : (
                <LinkButton to="/courses/new">Add a course</LinkButton>
              )
            }
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courses.data.items.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            {courses.data.totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-between" aria-label="Pagination">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={filters.page === 0}
                  onClick={() => updateFilters({ page: filters.page > 1 ? String(filters.page - 1) : null })}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-600">
                  Page {filters.page + 1} of {courses.data.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={filters.page + 1 >= courses.data.totalPages}
                  onClick={() => updateFilters({ page: String(filters.page + 1) })}
                >
                  Next
                </Button>
              </nav>
            )}
          </>
        )}
      </div>
    </>
  )
}
