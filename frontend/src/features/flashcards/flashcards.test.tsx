import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { anna, mockApi, signIn, statistics } from '../../test/mock-api'
import { renderApp } from '../../test/render'
import { parseCards } from './parse-cards'

const deck = {
  id: 'd1',
  title: 'Key terms',
  description: null,
  course: { id: statistics.id, code: statistics.code, name: statistics.name },
  cards: [],
  aiGenerated: false,
  canEdit: true,
}

describe('parseCards', () => {
  it('reads one card per line and skips lines without a back', () => {
    expect(parseCards('Mean ; The average\nMedian\tThe middle value\nno back here\n\n p ; q ; r ')).toEqual([
      { front: 'Mean', back: 'The average' },
      { front: 'Median', back: 'The middle value' },
      { front: 'p', back: 'q ; r' },
    ])
  })
})

describe('Studying a deck', () => {
  it('reveals each card, records the grade and repeats cards marked Again', async () => {
    signIn()
    const reviews: unknown[] = []
    mockApi({
      'GET /api/users/me': { body: anna },
      'GET /api/decks/d1': { body: deck },
      'GET /api/decks/d1/study': {
        body: [
          { id: 'c1', front: 'What is a p-value?', back: 'Probability of data this extreme under H0', isNew: true },
          { id: 'c2', front: 'What is a median?', back: 'The middle value', isNew: false },
        ],
      },
      'POST /api/cards/c1/reviews': ({ body }) => (reviews.push(['c1', body]), { body: { nextDueAt: '', intervalDays: 0 } }),
      'POST /api/cards/c2/reviews': ({ body }) => (reviews.push(['c2', body]), { body: { nextDueAt: '', intervalDays: 1 } }),
    })
    renderApp('/decks/d1/study')

    expect(await screen.findAllByText('What is a p-value?')).not.toHaveLength(0)
    expect(screen.getByRole('button', { name: /Good/ })).toBeDisabled()

    await userEvent.keyboard(' ')
    await userEvent.click(screen.getByRole('button', { name: /Again/ }))
    expect(await screen.findAllByText('What is a median?')).not.toHaveLength(0)

    await userEvent.click(screen.getByRole('button', { name: 'Show the answer' }))
    await userEvent.keyboard('3')
    // The card marked "Again" comes back at the end.
    expect(await screen.findByText('3 / 3')).toBeInTheDocument()
    await userEvent.keyboard(' ')
    await userEvent.keyboard('4')

    expect(await screen.findByRole('heading', { name: 'Session complete' })).toBeInTheDocument()
    expect(reviews).toEqual([
      ['c1', { grade: 'AGAIN' }],
      ['c2', { grade: 'GOOD' }],
      ['c1', { grade: 'EASY' }],
    ])
  })
})
