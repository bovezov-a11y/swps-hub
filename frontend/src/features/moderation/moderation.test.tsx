import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { anna, mockApi, signIn } from '../../test/mock-api'
import { renderApp } from '../../test/render'
import type { QueueItem } from './api'

const moderator = { ...anna, role: 'MODERATOR' }

const reported: QueueItem = {
  type: 'MATERIAL',
  id: 'm1',
  content: { title: 'Final exam 2025', excerpt: 'final-2025.pdf', courseCode: 'STA-201', link: '/courses/c1', hidden: true },
  reportCount: 3,
  reasons: { COPYRIGHT: 2, SPAM: 1 },
  details: ['This is the lecturer’s own file'],
  firstReportedAt: '2026-10-24T10:00:00Z',
}

describe('Moderation', () => {
  it('is staff only and not linked for students', async () => {
    signIn()
    mockApi({ 'GET /api/users/me': { body: anna } })
    renderApp('/moderation')

    expect(await screen.findByText('Staff only')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Account menu' }))
    expect(screen.queryByRole('menuitem', { name: 'Moderation' })).not.toBeInTheDocument()
  })

  it('shows reported content without reporters and restores it', async () => {
    signIn()
    let queue = [reported]
    mockApi({
      'GET /api/users/me': { body: moderator },
      'GET /api/moderation/queue': () => ({ body: queue }),
      'GET /api/moderation/log': { body: [] },
      'POST /api/moderation/MATERIAL/m1/restore': () => ((queue = []), { status: 204 }),
    })
    renderApp('/moderation')

    const card = (await screen.findByText('Final exam 2025')).closest('li')!
    expect(within(card).getByText(/This is the lecturer’s own file/)).toBeInTheDocument()
    expect(screen.queryByText('Anna Nowak')).not.toBeInTheDocument()

    await userEvent.click(within(card).getByRole('button', { name: /Restore/ }))
    expect(await screen.findByText('Nothing to review')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Account menu' }))
    expect(screen.getByRole('menuitem', { name: 'Moderation' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'University insights' })).not.toBeInTheDocument()
  })
})
