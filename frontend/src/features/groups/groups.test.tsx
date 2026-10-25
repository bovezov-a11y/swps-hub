import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { anna, mockApi, signIn, statistics } from '../../test/mock-api'
import { renderApp } from '../../test/render'
import type { StudyGroup } from './api'

const courseDetail = { ...statistics, enrolled: true, description: null, canEdit: false, createdAt: '2026-10-01T10:00:00Z' }

const outsider: StudyGroup = {
  id: 'g1',
  name: 'Midterm prep',
  description: 'Past exams every week',
  meetingDetails: null,
  capacity: 4,
  memberCount: 2,
  member: false,
  mine: false,
  members: [],
  createdAt: '2026-10-20T10:00:00Z',
  canDelete: false,
}

const member: StudyGroup = {
  ...outsider,
  meetingDetails: 'Library room 2, Thursdays 17:00',
  memberCount: 3,
  member: true,
  members: ['Anna Nowak', 'Jan Kowalski', 'Ola Wiśniewska'],
}

describe('Study groups', () => {
  it('hides members and meeting place until you join', async () => {
    signIn()
    let joined = false
    mockApi({
      'GET /api/users/me': { body: anna },
      [`GET /api/courses/${statistics.id}`]: { body: courseDetail },
      [`GET /api/courses/${statistics.id}/groups`]: () => ({ body: [joined ? member : outsider] }),
      'PUT /api/groups/g1/membership': () => ((joined = true), { status: 204 }),
    })
    renderApp(`/courses/${statistics.id}?tab=groups`)

    const card = (await screen.findByRole('heading', { name: 'Midterm prep' })).closest('li')!
    expect(within(card).getByText('2/4')).toBeInTheDocument()
    expect(within(card).queryByText(/Library room/)).not.toBeInTheDocument()

    await userEvent.click(within(card).getByRole('button', { name: 'Join group' }))

    expect(await within(card).findByText('Library room 2, Thursdays 17:00')).toBeInTheDocument()
    expect(within(card).getByText('Anna Nowak, Jan Kowalski, Ola Wiśniewska')).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: 'Leave group' })).toBeInTheDocument()
  })
})
