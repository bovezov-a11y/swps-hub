import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { Button } from '../../components/Button'
import { ErrorState } from '../../components/EmptyState'
import { SelectField, TextAreaField, TextField } from '../../components/fields'
import { FormAlert } from '../../components/FormAlert'
import { FullPageSpinner } from '../../components/Spinner'
import { studyYearLabel, studyYears, termOrder, terms } from '../../lib/academic'
import { applyServerErrors } from '../../lib/form-errors'
import type { CourseDetail, Program } from '../../lib/types'
import { usePrograms } from '../programs/api'
import { useCourse, useSaveCourse } from './api'
import { courseSchema, type CourseFormValues } from './schemas'

export function CourseFormPage() {
  const { courseId } = useParams()
  const course = useCourse(courseId)
  const programs = usePrograms()

  if (programs.isPending || (courseId !== undefined && course.isPending)) return <FullPageSpinner />
  if (programs.isError || course.isError) return <ErrorState text="Could not load this page." />
  if (course.data && !course.data.canEdit) {
    return <ErrorState text="Only the course author or a moderator can edit this course." />
  }
  return <CourseForm course={course.data} programs={programs.data} />
}

function CourseForm({ course, programs }: { course?: CourseDetail; programs: Program[] }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const saveCourse = useSaveCourse(course?.id)
  const preselected = programs.find((program) => program.slug === searchParams.get('program'))

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      programId: course?.program.id ?? preselected?.id ?? '',
      studyYear: course?.studyYear ?? 1,
      term: course?.term ?? 'WINTER',
      code: course?.code ?? '',
      name: course?.name ?? '',
      lecturer: course?.lecturer ?? '',
      description: course?.description ?? '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await saveCourse.mutateAsync(values)
      navigate(`/courses/${saved.id}`)
    } catch (error) {
      applyServerErrors(
        error,
        ['programId', 'studyYear', 'term', 'code', 'name', 'lecturer', 'description'],
        setError,
      )
    }
  })

  const backTo = course ? `/courses/${course.id}` : preselected ? `/programs/${preselected.slug}` : '/explore'

  return (
    <div className="mx-auto max-w-2xl">
      <Link to={backTo} className="text-sm font-medium text-slate-500 hover:text-slate-900">
        ← Back
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{course ? 'Edit course' : 'Add a course'}</h1>
      <p className="mt-2 text-slate-600">
        {course
          ? 'Keep the course details accurate for everyone who uses it.'
          : 'Add a course once and students from every year can share materials in it. You will join it automatically.'}
      </p>

      <form
        onSubmit={onSubmit}
        noValidate
        className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8"
      >
        {errors.root && <FormAlert message={errors.root.message} />}
        <SelectField label="Program" error={errors.programId?.message} {...register('programId')}>
          <option value="" disabled>
            Choose your program
          </option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </SelectField>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <SelectField
            label="Year of study"
            error={errors.studyYear?.message}
            {...register('studyYear', { setValueAs: Number })}
          >
            {studyYears.map((year) => (
              <option key={year} value={year}>
                {studyYearLabel(year)}
              </option>
            ))}
          </SelectField>
          <SelectField label="Semester" error={errors.term?.message} {...register('term')}>
            {termOrder.map((term) => (
              <option key={term} value={term}>
                {terms[term]}
              </option>
            ))}
          </SelectField>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[1fr_2fr]">
          <TextField label="Course code" placeholder="PSY-101" error={errors.code?.message} {...register('code')} />
          <TextField
            label="Course name"
            placeholder="Introduction to Psychology"
            error={errors.name?.message}
            {...register('name')}
          />
        </div>
        <TextField
          label="Lecturer (optional)"
          placeholder="Dr Anna Kowalska"
          error={errors.lecturer?.message}
          {...register('lecturer')}
        />
        <TextAreaField
          label="Description (optional)"
          placeholder="What the course covers, how it is graded, useful links…"
          error={errors.description?.message}
          {...register('description')}
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={() => navigate(backTo)}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {course ? 'Save changes' : 'Add course'}
          </Button>
        </div>
      </form>
    </div>
  )
}
