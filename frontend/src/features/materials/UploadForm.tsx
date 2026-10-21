import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type DragEvent } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '../../components/Button'
import { SelectField, TextAreaField, TextField } from '../../components/fields'
import { FormAlert } from '../../components/FormAlert'
import { academicYearOf, academicYearOptions, formatFileSize, materialTypeOrder, materialTypes } from '../../lib/academic'
import { applyServerErrors } from '../../lib/form-errors'
import { useUploadMaterial } from './api'
import { ACCEPTED_EXTENSIONS, materialSchema, type MaterialFormValues } from './schemas'

export function UploadForm({ courseId, onDone }: { courseId: string; onDone: () => void }) {
  const upload = useUploadMaterial(courseId)
  const [today] = useState(() => new Date())
  const [isDragging, setIsDragging] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    control,
    formState: { errors, isSubmitting },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      type: 'PAST_EXAM',
      title: '',
      academicYear: academicYearOf(today),
      description: '',
    },
  })
  const file = useWatch({ control, name: 'file' })

  const chooseFile = (chosen: File | undefined) => {
    if (!chosen) return
    setValue('file', chosen, { shouldValidate: true })
    // Suggest a title from the file name so most uploads need no typing.
    if (!getValues('title')) {
      setValue('title', chosen.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '), { shouldValidate: true })
    }
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    chooseFile(event.dataTransfer.files[0])
  }

  const onSubmit = handleSubmit(async (values) => {
    const form = new FormData()
    form.append('file', values.file)
    form.append('type', values.type)
    form.append('title', values.title)
    form.append('academicYear', values.academicYear)
    if (values.description) form.append('description', values.description)
    try {
      await upload.mutateAsync(form)
      onDone()
    } catch (error) {
      applyServerErrors(error, ['file', 'type', 'title', 'academicYear', 'description'], setError)
    }
  })

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-5 rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm"
      aria-label="Share a file"
    >
      <h3 className="font-semibold">Share a file</h3>
      {errors.root && <FormAlert message={errors.root.message} />}

      <div>
        <label
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
            errors.file
              ? 'border-red-300 bg-red-50/50'
              : isDragging
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
          }`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-8 text-indigo-500" aria-hidden="true">
            <path d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {file ? (
            <span className="mt-2 text-sm">
              <span className="font-medium text-slate-900">{file.name}</span>
              <span className="text-slate-500"> · {formatFileSize(file.size)}</span>
            </span>
          ) : (
            <span className="mt-2 text-sm text-slate-600">
              <span className="font-semibold text-indigo-600">Choose a file</span> or drag it here
            </span>
          )}
          <span className="mt-1 text-xs text-slate-500">PDF, images, Office documents, text or ZIP · up to 25 MB</span>
          <input
            type="file"
            className="sr-only"
            aria-label="File"
            accept={ACCEPTED_EXTENSIONS.map((extension) => `.${extension}`).join(',')}
            onChange={(event) => chooseFile(event.target.files?.[0])}
          />
        </label>
        {errors.file && <p className="mt-1.5 text-sm text-red-600">{errors.file.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <SelectField label="What is it?" {...register('type')}>
          {materialTypeOrder.map((type) => (
            <option key={type} value={type}>
              {materialTypes[type].label}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Academic year"
          hint="When the exam was written or the notes were taken."
          error={errors.academicYear?.message}
          {...register('academicYear')}
        >
          {academicYearOptions(today).map((year) => (
            <option key={year}>{year}</option>
          ))}
        </SelectField>
      </div>
      <TextField
        label="Title"
        placeholder="Final exam, group A"
        error={errors.title?.message}
        {...register('title')}
      />
      <TextAreaField
        label="Description (optional)"
        rows={3}
        placeholder="What it covers, which lecturer, any tips…"
        error={errors.description?.message}
        {...register('description')}
      />
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Share
        </Button>
      </div>
    </form>
  )
}
