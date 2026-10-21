import { z } from 'zod'
import { termOrder } from '../../lib/academic'
import { eventTypeOrder } from '../../lib/event-types'

export const courseSchema = z.object({
  programId: z.string().min(1, { error: 'Choose a program' }),
  studyYear: z.number({ error: 'Choose a year' }).int().min(1).max(5),
  term: z.enum(termOrder),
  code: z.string().trim().min(1, { error: 'Enter the course code' }).max(20, { error: 'Use at most 20 characters' }),
  name: z.string().trim().min(1, { error: 'Enter the course name' }).max(200, { error: 'Use at most 200 characters' }),
  lecturer: z.string().trim().max(100, { error: 'Use at most 100 characters' }),
  description: z.string().trim().max(2000, { error: 'Use at most 2000 characters' }),
})

export const eventSchema = z
  .object({
    type: z.enum(eventTypeOrder),
    title: z.string().trim().min(1, { error: 'Enter a title' }).max(200, { error: 'Use at most 200 characters' }),
    date: z.string().min(1, { error: 'Choose a date' }),
    startTime: z.string().min(1, { error: 'Choose a time' }),
    endTime: z.string(),
    location: z.string().trim().max(200, { error: 'Use at most 200 characters' }),
    repeat: z.boolean(),
    repeatWeeks: z
      .number({ error: 'Enter a number of weeks' })
      .int()
      .min(2, { error: 'Repeat at least 2 times' })
      .max(20, { error: 'Repeat at most 20 times' }),
  })
  .superRefine((values, ctx) => {
    // A deadline is a single point in time, so it has no end time.
    if (values.type === 'DEADLINE') return
    if (!values.endTime) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'Choose an end time' })
    } else if (values.startTime && values.endTime <= values.startTime) {
      ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'Must be after the start time' })
    }
  })

export type CourseFormValues = z.infer<typeof courseSchema>
export type EventFormValues = z.infer<typeof eventSchema>
