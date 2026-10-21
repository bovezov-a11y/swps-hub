import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { anna, emptyPage, mockApi, programs, signIn, statistics } from '../../test/mock-api'
import { renderApp } from '../../test/render'

const page = (items: unknown[]) => ({ ...emptyPage, items, totalItems: items.length, totalPages: 1 })

describe('courses', () => {
  it('searches courses across all programs from the explore page', async () => {
    signIn()
    mockApi({
      'GET /api/users/me': { body: anna },
      'GET /api/programs': { body: programs },
      'GET /api/courses': ({ url }) => ({ body: url.searchParams.get('q') === 'stat' ? page([statistics]) : emptyPage }),
    })
    const router = renderApp('/explore')

    expect(await screen.findByRole('link', { name: /Psychology/ })).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Search courses'), 'stat')

    expect(await screen.findByText('Statistics in Psychology')).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.search).toBe('?q=stat'))
  })

  it('groups a program’s courses by year and lets students join them', async () => {
    signIn()
    let enrolled = false
    mockApi({
      'GET /api/users/me': { body: anna },
      'GET /api/programs': { body: programs },
      'GET /api/courses': () => ({
        body: page([
          { ...statistics, enrolled },
          { ...statistics, id: 'c2', code: 'PSY-301', name: 'Clinical Psychology', studyYear: 3 },
        ]),
      }),
      [`PUT /api/courses/${statistics.id}/enrollment`]: () => {
        enrolled = true
        return { status: 204 }
      },
    })
    renderApp('/programs/psychology')

    const yearTwo = (await screen.findByRole('heading', { name: 'Year 2' })).closest('section')!
    expect(within(yearTwo).getByText('Statistics in Psychology')).toBeInTheDocument()
    const yearThree = screen.getByRole('heading', { name: 'Year 3' }).closest('section')!
    expect(within(yearThree).getByText('Clinical Psychology')).toBeInTheDocument()

    await userEvent.click(within(yearTwo).getByRole('button', { name: 'Join Statistics in Psychology' }))
    expect(await within(yearTwo).findByText('Joined')).toBeInTheDocument()
  })

  it('preselects the program and shows server errors when adding a course', async () => {
    signIn()
    const fetchMock = mockApi({
      'GET /api/users/me': { body: anna },
      'GET /api/programs': { body: programs },
      'POST /api/courses': {
        status: 409,
        body: { status: 409, detail: 'Psychology already has a course with code STA-201' },
      },
    })
    renderApp('/courses/new?program=psychology')

    expect(await screen.findByLabelText('Program')).toHaveValue(programs[0]!.id)
    await userEvent.selectOptions(screen.getByLabelText('Year of study'), '2')
    await userEvent.type(screen.getByLabelText('Course code'), 'sta-201')
    await userEvent.type(screen.getByLabelText('Course name'), 'Statistics in Psychology')
    await userEvent.click(screen.getByRole('button', { name: 'Add course' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Psychology already has a course with code STA-201')
    const [, init] = fetchMock.mock.calls.find(([url]) => url === '/api/courses')!
    expect(JSON.parse(init!.body as string)).toMatchObject({ programId: programs[0]!.id, studyYear: 2, term: 'WINTER' })
  })
})
