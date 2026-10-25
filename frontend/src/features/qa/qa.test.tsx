import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { anna, mockApi, signIn, statistics } from '../../test/mock-api'
import { renderApp } from '../../test/render'
import type { QuestionDetail, QuestionSummary } from './api'

const courseDetail = { ...statistics, enrolled: true, description: null, canEdit: false, createdAt: '2026-10-01T10:00:00Z' }

const question: QuestionDetail = {
  id: 'q1',
  course: { id: statistics.id, code: statistics.code, name: statistics.name },
  title: 'Is the final open book?',
  body: 'The syllabus does not say.',
  voteCount: 2,
  voted: false,
  mine: true,
  hidden: false,
  createdAt: '2026-10-24T10:00:00Z',
  canDelete: true,
  answers: [
    {
      id: 'a1',
      body: 'Last year it was, one A4 page of notes.',
      author: 'STUDENT',
      voteCount: 1,
      voted: false,
      accepted: false,
      hidden: false,
      createdAt: '2026-10-24T12:00:00Z',
      canDelete: false,
    },
  ],
}

describe('Course Q&A', () => {
  it('lets a student ask anonymously and shows the question in the list', async () => {
    signIn()
    const questions: QuestionSummary[] = []
    mockApi({
      'GET /api/users/me': { body: anna },
      [`GET /api/courses/${statistics.id}`]: { body: courseDetail },
      [`GET /api/courses/${statistics.id}/questions`]: () => ({ body: questions }),
      [`POST /api/courses/${statistics.id}/questions`]: ({ body }) => {
        const input = body as { title: string; body: string }
        questions.push({
          id: 'q2',
          title: input.title,
          excerpt: input.body,
          voteCount: 0,
          voted: false,
          answerCount: 0,
          solved: false,
          mine: true,
          hidden: false,
          createdAt: new Date().toISOString(),
        })
        return { status: 201, body: { id: 'q2' } }
      },
    })
    renderApp(`/courses/${statistics.id}?tab=qa`)

    expect(await screen.findByText('No questions yet')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Ask a question' }))
    await userEvent.type(screen.getByLabelText('Question'), 'When is the retake?')
    await userEvent.type(screen.getByLabelText('Details'), 'I missed the first date.')
    await userEvent.click(screen.getByRole('button', { name: 'Post question' }))

    const link = await screen.findByRole('link', { name: /When is the retake\?/ })
    expect(link).toHaveTextContent('Asked by you')
    expect(link).toHaveAttribute('href', '/questions/q2')
  })

  it('shows answers without names and lets the asker accept one', async () => {
    signIn()
    let accepted: string | null = null
    mockApi({
      'GET /api/users/me': { body: anna },
      'GET /api/questions/q1': () => ({
        body: { ...question, answers: question.answers.map((answer) => ({ ...answer, accepted: answer.id === accepted })) },
      }),
      'PUT /api/questions/q1/accepted-answer': ({ body }) => {
        accepted = (body as { answerId: string }).answerId
        return { status: 204 }
      },
    })
    renderApp('/questions/q1')

    const answer = (await screen.findByText('Last year it was, one A4 page of notes.')).closest('li')!
    expect(within(answer).getByText(/A student/)).toBeInTheDocument()
    expect(screen.queryByText('Anna Nowak')).not.toBeInTheDocument()

    await userEvent.click(within(answer).getByRole('button', { name: 'Accept this answer' }))
    expect(await within(answer).findByText('Accepted answer')).toBeInTheDocument()
  })
})
