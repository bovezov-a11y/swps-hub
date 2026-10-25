import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { anna, mockApi, signIn, statistics } from '../../test/mock-api'
import { renderApp } from '../../test/render'

const courseDetail = { ...statistics, description: null, canEdit: false, createdAt: '2026-10-01T10:00:00Z' }

const pastExam = {
  id: 'm1',
  course: { id: statistics.id, code: statistics.code, name: statistics.name },
  type: 'PAST_EXAM',
  title: 'Final exam 2025',
  description: null,
  academicYear: '2025/26',
  fileName: 'final-2025.pdf',
  contentType: 'application/pdf',
  fileSize: 1_200_000,
  voteCount: 0,
  voted: false,
  uploader: null,
  mine: false,
  createdAt: '2026-10-20T10:00:00Z',
  canDelete: false,
}

const slides = { ...pastExam, id: 'm2', title: 'Lecture slides', fileName: 'slides.pptx', contentType: 'application/vnd.ms-powerpoint' }

function mockCourse(aiEnabled: boolean) {
  signIn()
  return mockApi({
    'GET /api/users/me': { body: anna },
    [`GET /api/courses/${statistics.id}`]: { body: courseDetail },
    [`GET /api/courses/${statistics.id}/materials`]: { body: [pastExam, slides] },
    'GET /api/ai/status': { body: { enabled: aiEnabled, dailyLimit: 20, usedToday: 2 } },
    'POST /api/materials/m1/ai/summary': {
      body: {
        overview: 'The exam covers hypothesis testing.',
        keyPoints: ['A p-value is not the probability that H0 is true'],
        keyTerms: [{ term: 'p-value', definition: 'Probability of data this extreme under H0.' }],
      },
    },
    'POST /api/materials/m1/ai/quiz': {
      body: {
        questions: [
          {
            question: 'What does a p-value of 0.03 mean?',
            options: ['H0 is 3% likely', 'Data this extreme has a 3% chance under H0', 'The effect is large', 'H1 is true'],
            correctOptionIndex: 1,
            explanation: 'It is about the data assuming H0, not about H0 itself.',
          },
        ],
      },
    },
  })
}

describe('AI study tools', () => {
  it('are offered only for files the model can read', async () => {
    mockCourse(true)
    renderApp(`/courses/${statistics.id}`)

    const exam = (await screen.findByRole('heading', { name: 'Final exam 2025' })).closest('li')!
    const slideDeck = screen.getByRole('heading', { name: 'Lecture slides' }).closest('li')!
    expect(await within(exam).findByRole('button', { name: 'Summary, quiz & cards' })).toBeInTheDocument()
    expect(within(slideDeck).queryByRole('button', { name: 'Summary, quiz & cards' })).not.toBeInTheDocument()
  })

  it('are hidden when the server has no AI key', async () => {
    mockCourse(false)
    renderApp(`/courses/${statistics.id}`)

    await screen.findByRole('heading', { name: 'Final exam 2025' })
    expect(screen.queryByRole('button', { name: 'Summary, quiz & cards' })).not.toBeInTheDocument()
  })

  it('show a summary and an interactive quiz', async () => {
    mockCourse(true)
    renderApp(`/courses/${statistics.id}`)

    await userEvent.click(await screen.findByRole('button', { name: 'Summary, quiz & cards' }))
    const dialog = await screen.findByRole('dialog')

    expect(await within(dialog).findByText('The exam covers hypothesis testing.')).toBeInTheDocument()
    expect(within(dialog).getByText('p-value')).toBeInTheDocument()
    expect(within(dialog).getByText('2 of 20 new generations used today')).toBeInTheDocument()

    await userEvent.click(within(dialog).getByRole('tab', { name: 'Practice quiz' }))
    await userEvent.click(await within(dialog).findByRole('button', { name: 'H0 is 3% likely' }))

    expect(within(dialog).getByText('It is about the data assuming H0, not about H0 itself.')).toBeInTheDocument()
    expect(within(dialog).getByText('You got 0 of 1 right')).toBeInTheDocument()
  })
})
