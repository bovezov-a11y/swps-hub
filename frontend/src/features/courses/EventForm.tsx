import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Button } from '../../components/Button'
import { SelectField, TextField } from '../../components/fields'
import { FormAlert } from '../../components/FormAlert'
import { addDays, dayKey } from '../../lib/dates'
import { eventTypeOrder, eventTypes } from '../../lib/event-types'
import { applyServerErrors } from '../../lib/form-errors'
import { useCreateEvents, type EventInput } from './api'
import { eventSchema, type EventFormValues } from './schemas'

const titlePlaceholders = {
  LECTURE: 'Lecture 3: Memory and learning',
  CLASS: 'Class: problem set 2',
  LAB: 'Lab 1: SPSS basics',
  EXAM: 'Final exam',
  DEADLINE: 'Essay submission',
  OTHER: 'Guest talk',
}

export function EventForm({ courseId, onDone }: { courseId: string; onDone: () => void }) {
  const createEvents = useCreateEvents(courseId)
  const [tomorrow] = useState(() => dayKey(addDays(new Date(), 1)))
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      type: 'LECTURE',
      title: '',
      date: tomorrow,
      startTime: '10:00',
      endTime: '11:30',
      location: '',
      repeat: false,
      repeatWeeks: 12,
    },
  })
  const type = useWatch({ control, name: 'type' })
  const repeat = useWatch({ control, name: 'repeat' })
  const isDeadline = type === 'DEADLINE'

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createEvents.mutateAsync(toRequest(values))
      onDone()
    } catch (error) {
      applyServerErrors(error, ['title', 'location'], setError)
    }
  })

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-5 rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm"
      aria-label="Add event"
    >
      <h3 className="font-semibold">Add an event</h3>
      {errors.root && <FormAlert message={errors.root.message} />}
      <div className="grid gap-5 sm:grid-cols-[1fr_2fr]">
        <SelectField label="Type" {...register('type')}>
          {eventTypeOrder.map((value) => (
            <option key={value} value={value}>
              {eventTypes[value].label}
            </option>
          ))}
        </SelectField>
        <TextField
          label="Title"
          placeholder={titlePlaceholders[type]}
          error={errors.title?.message}
          {...register('title')}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <TextField label="Date" type="date" error={errors.date?.message} {...register('date')} />
        <TextField
          label={isDeadline ? 'Due at' : 'Starts'}
          type="time"
          error={errors.startTime?.message}
          {...register('startTime')}
        />
        {!isDeadline && <TextField label="Ends" type="time" error={errors.endTime?.message} {...register('endTime')} />}
      </div>
      <TextField
        label="Location (optional)"
        placeholder="Room 204, Chodakowska 19/31"
        error={errors.location?.message}
        {...register('location')}
      />
      <div className="flex flex-wrap items-center gap-4">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" className="size-4 rounded border-slate-300 accent-indigo-600" {...register('repeat')} />
          Repeat weekly
        </label>
        {repeat && (
          <TextField
            label="Number of weeks"
            type="number"
            min={2}
            max={20}
            className="w-40"
            error={errors.repeatWeeks?.message}
            {...register('repeatWeeks', { valueAsNumber: true })}
          />
        )}
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Add event
        </Button>
      </div>
    </form>
  )
}

/** Form values are local wall-clock times; the API expects instants. */
function toRequest(values: EventFormValues): EventInput {
  const startsAt = new Date(`${values.date}T${values.startTime}`)
  const endsAt = values.type === 'DEADLINE' ? startsAt : new Date(`${values.date}T${values.endTime}`)
  return {
    type: values.type,
    title: values.title,
    startsAt: startsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    location: values.location || null,
    repeatWeeks: values.repeat ? values.repeatWeeks : null,
  }
}
