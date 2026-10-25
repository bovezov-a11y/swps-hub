import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { anna, mockApi, signIn, statistics } from '../../test/mock-api'
import { renderApp } from '../../test/render'
import type { SyllabusImport } from '../ai/api'

const courseDetail = { ...statistics, enrolled: true, description: null, canEdit: false, createdAt: '2026-10-01T10:00:00Z' }

const syllabus: SyllabusImport = {
  gradingSummary: 'Midterm 30%, essay 20%, final exam 50%.',
  items: [
    { title: 'Midterm exam', type: 'EXAM', date: '2026-11-18', time: '10:00:00', weightPercent: 30, timing: null },
    { title: 'Final exam', type: 'EXAM', date: null, time: null, weightPercent: 50, timing: 'exam session' },
  ],
}

describe('Importing dates from a syllabus', () => {
  it('lets the student review the AI result and adds only the dated items', async () => {
    signIn()
    const created: { type: string; title: string; startsAt: string; endsAt: string }[] = []
    mockApi({
      'GET /api/users/me': { body: anna },
      [`GET /api/courses/${statistics.id}`]: { body: courseDetail },
      [`GET /api/courses/${statistics.id}/events`]: { body: [] },
      'GET /api/ai/status': { body: { enabled: true, dailyLimit: 20, usedToday: 0 } },
      [`POST /api/courses/${statistics.id}/ai/syllabus`]: { body: syllabus },
      [`POST /api/courses/${statistics.id}/events`]: ({ body }) => {
        created.push(body as (typeof created)[number])
        return { status: 201, body: [] }
      },
    })
    renderApp(`/courses/${statistics.id}?tab=schedule`)

    await userEvent.click(await screen.findByRole('button', { name: 'Import from syllabus' }))
    const file = new File(['%PDF'], 'syllabus.pdf', { type: 'application/pdf' })
    await userEvent.upload(screen.getByLabelText('Syllabus file'), file)

    expect(await screen.findByText(/Midterm 30%, essay 20%/)).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Add Midterm exam' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Add Final exam' })).not.toBeChecked()
    expect(screen.getByText(/Syllabus says: exam session/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Add 1 to the schedule' }))

    expect(await screen.findByText('Added 1 date to the course schedule')).toBeInTheDocument()
    expect(created).toHaveLength(1)
    expect(created[0]).toMatchObject({ type: 'EXAM', title: 'Midterm exam' })
    expect(new Date(created[0]!.endsAt).getTime() - new Date(created[0]!.startsAt).getTime()).toBe(2 * 60 * 60 * 1000)
  })

  it('is hidden when AI tools are not set up', async () => {
    signIn()
    mockApi({
      'GET /api/users/me': { body: anna },
      [`GET /api/courses/${statistics.id}`]: { body: courseDetail },
      [`GET /api/courses/${statistics.id}/events`]: { body: [] },
      'GET /api/ai/status': { body: { enabled: false, dailyLimit: 20, usedToday: 0 } },
    })
    renderApp(`/courses/${statistics.id}?tab=schedule`)

    expect(await screen.findByRole('button', { name: 'Add event' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Import from syllabus' })).not.toBeInTheDocument()
  })
})
