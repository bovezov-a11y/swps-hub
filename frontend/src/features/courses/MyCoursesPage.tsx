import { LinkButton } from '../../components/Button'
import { EmptyState, ErrorState } from '../../components/EmptyState'
import { Spinner } from '../../components/Spinner'
import { useCourses } from './api'
import { CourseCard } from './CourseCard'

export function MyCoursesPage() {
  const courses = useCourses({ mine: true, size: 100 })

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My courses</h1>
          <p className="mt-2 text-slate-600">The courses you joined. Their events appear in your calendar.</p>
        </div>
        <LinkButton to="/explore" variant="secondary">
          Find more courses
        </LinkButton>
      </div>

      <div className="mt-8">
        {courses.isPending ? (
          <div className="flex justify-center py-16 text-indigo-600">
            <Spinner />
          </div>
        ) : courses.isError ? (
          <ErrorState text="Could not load your courses." />
        ) : courses.data.items.length === 0 ? (
          <EmptyState
            title="You have not joined any courses yet"
            text="Find your program, then join the courses you take to see their schedule and materials here."
            action={<LinkButton to="/explore">Explore programs</LinkButton>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.data.items.map((course) => (
              <CourseCard key={course.id} course={course} showProgram />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
