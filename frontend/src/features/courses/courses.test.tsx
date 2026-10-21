import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { anna, emptyPage, mockApi, signIn } from '../../test/mock-api'
import { renderApp } from '../../test/render'

const statistics = {
  id: 'c0000000-0000-4000-8000-000000000001',
  code: 'STA-201',
  name: 'Statistics in Psychology',
  semester: '2026/27 Winter',
  lecturer: 'Dr Kowalska',
  memberCount: 12,
  enrolled: false,
}

describe('courses', () => {
  it('lets a student join a course from the list', async () => {
    signIn()
    let enrolled = false
    mockApi({
      'GET /api/users/me': { body: anna },
      'GET /api/courses': () => ({
        body: { ...emptyPage, items: [{ ...statistics, enrolled }], totalItems: 1, totalPages: 1 },
      }),
      [`PUT /api/courses/${statistics.id}/enrollment`]: () => {
        enrolled = true
        return { status: 204 }
      },
    })
    renderApp('/courses')

    await userEvent.click(await screen.findByRole('button', { name: 'Join Statistics in Psychology' }))

    expect(await screen.findByText('Joined')).toBeInTheDocument()
  })

  it('sends search text to the API after the user stops typing', async () => {
    signIn()
    const fetchMock = mockApi({
      'GET /api/users/me': { body: anna },
      'GET /api/courses': ({ url }) => ({
        body: url.searchParams.get('q') === 'stat' ? { ...emptyPage, items: [statistics], totalItems: 1, totalPages: 1 } : emptyPage,
      }),
    })
    const router = renderApp('/courses')

    await userEvent.type(await screen.findByLabelText('Search courses'), 'stat')

    expect(await screen.findByText('Statistics in Psychology')).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.search).toBe('?q=stat'))
    const searches = fetchMock.mock.calls.map(([url]) => url).filter((url) => url.startsWith('/api/courses?'))
    expect(searches).not.toContain('/api/courses?page=0&q=s')
  })

  it('shows field errors returned by the server when adding a course', async () => {
    signIn()
    mockApi({
      'GET /api/users/me': { body: anna },
      'POST /api/courses': {
        status: 409,
        body: { status: 409, detail: 'Course STA-201 already exists in 2026/27 Winter' },
      },
    })
    renderApp('/courses/new')

    await userEvent.type(await screen.findByLabelText('Course code'), 'sta-201')
    await userEvent.type(screen.getByLabelText('Course name'), 'Statistics in Psychology')
    await userEvent.click(screen.getByRole('button', { name: 'Add course' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Course STA-201 already exists in 2026/27 Winter')
  })
})
