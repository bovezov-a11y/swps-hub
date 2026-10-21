import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { Button } from '../../components/Button'
import { ErrorState } from '../../components/EmptyState'
import { SelectField, TextAreaField, TextField } from '../../components/fields'
import { FormAlert } from '../../components/FormAlert'
import { FullPageSpinner } from '../../components/Spinner'
import { applyServerErrors } from '../../lib/form-errors'
import { semesterOf, semesterOptions } from '../../lib/semesters'
import type { CourseDetail } from '../../lib/types'
import { useCourse, useSaveCourse } from './api'
import { courseSchema, type CourseFormValues } from './schemas'

export function CourseFormPage() {
  const { courseId } = useParams()
  const course = useCourse(courseId)

  if (courseId === undefined) return <CourseForm />
  if (course.isPending) return <FullPageSpinner />
  if (course.isError) return <ErrorState text="Could not load this course." />
  if (!course.data.canEdit) return <ErrorState text="Only the course author or a moderator can edit this course." />
  return <CourseForm course={course.data} />
}

function CourseForm({ course }: { course?: CourseDetail }) {
  const navigate = useNavigate()
  const saveCourse = useSaveCourse(course?.id)
  const [today] = useState(() => new Date())
  const semesters = semesterOptions(today)
  if (course && !semesters.includes(course.semester)) semesters.push(course.semester)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      code: course?.code ?? '',
      name: course?.name ?? '',
      semester: course?.semester ?? semesterOf(today),
      lecturer: course?.lecturer ?? '',
      description: course?.description ?? '',
    },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await saveCourse.mutateAsync(values)
      navigate(`/courses/${saved.id}`)
    } catch (error) {
      applyServerErrors(error, ['code', 'name', 'semester', 'lecturer', 'description'], setError)
    }
  })

  const backTo = course ? `/courses/${course.id}` : '/courses'

  return (
    <div className="mx-auto max-w-2xl">
      <Link to={backTo} className="text-sm font-medium text-slate-500 hover:text-slate-900">
        ← Back
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{course ? 'Edit course' : 'Add a course'}</h1>
      <p className="mt-2 text-slate-600">
        {course
          ? 'Keep the course details accurate for everyone who joined.'
          : 'You will join the course automatically, and classmates can find and join it too.'}
      </p>

      <form
        onSubmit={onSubmit}
        noValidate
        className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8"
      >
        {errors.root && <FormAlert message={errors.root.message} />}
        <div className="grid gap-5 sm:grid-cols-[1fr_2fr]">
          <TextField label="Course code" placeholder="PSY-101" error={errors.code?.message} {...register('code')} />
          <TextField
            label="Course name"
            placeholder="Introduction to Psychology"
            error={errors.name?.message}
            {...register('name')}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField label="Semester" error={errors.semester?.message} {...register('semester')}>
            {semesters.map((semester) => (
              <option key={semester}>{semester}</option>
            ))}
          </SelectField>
          <TextField
            label="Lecturer (optional)"
            placeholder="Dr Anna Kowalska"
            error={errors.lecturer?.message}
            {...register('lecturer')}
          />
        </div>
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
