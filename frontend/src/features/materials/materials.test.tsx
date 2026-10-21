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
  description: 'Group A, open questions',
  academicYear: '2025/26',
  fileName: 'final-2025.pdf',
  contentType: 'application/pdf',
  fileSize: 1_200_000,
  voteCount: 4,
  voted: false,
  uploader: { id: 'u2', displayName: 'Jan Kowalski' },
  createdAt: '2026-10-20T10:00:00Z',
  canDelete: false,
}

describe('course materials', () => {
  it('lists materials and counts an upvote straight away', async () => {
    signIn()
    let voted = false
    mockApi({
      'GET /api/users/me': { body: anna },
      [`GET /api/courses/${statistics.id}`]: { body: courseDetail },
      [`GET /api/courses/${statistics.id}/materials`]: () => ({
        body: [{ ...pastExam, voted, voteCount: voted ? 5 : 4 }],
      }),
      'PUT /api/materials/m1/vote': () => {
        voted = true
        return { body: { voteCount: 5, voted: true } }
      },
    })
    renderApp(`/courses/${statistics.id}`)

    const card = (await screen.findByRole('heading', { name: 'Final exam 2025' })).closest('li')!
    expect(within(card).getByText('Shared by Jan Kowalski', { exact: false })).toBeInTheDocument()

    await userEvent.click(within(card).getByRole('button', { name: 'Upvote Final exam 2025' }))

    const voteButton = within(card).getByRole('button', { name: 'Remove your upvote from Final exam 2025' })
    expect(voteButton).toHaveAttribute('aria-pressed', 'true')
    expect(voteButton).toHaveTextContent('5')
  })

  it('uploads a file with a title suggested from its name', async () => {
    signIn()
    const fetchMock = mockApi({
      'GET /api/users/me': { body: anna },
      [`GET /api/courses/${statistics.id}`]: { body: courseDetail },
      [`GET /api/courses/${statistics.id}/materials`]: { body: [] },
      [`POST /api/courses/${statistics.id}/materials`]: { status: 201, body: pastExam },
    })
    renderApp(`/courses/${statistics.id}`)

    await userEvent.click(await screen.findByRole('button', { name: 'Share the first file' }))
    const form = screen.getByRole('form', { name: 'Share a file' })
    await userEvent.upload(
      within(form).getByLabelText('File'),
      new File(['%PDF'], 'final_exam-2025.pdf', { type: 'application/pdf' }),
    )

    expect(within(form).getByLabelText('Title')).toHaveValue('final exam 2025')
    await userEvent.click(within(form).getByRole('button', { name: 'Share' }))

    await screen.findByRole('button', { name: 'Share a file' })
    const call = fetchMock.mock.calls.find(([url, init]) => url.endsWith('/materials') && init?.method === 'POST')
    const uploaded = call?.[1]?.body as FormData
    expect(uploaded.get('type')).toBe('PAST_EXAM')
    expect(uploaded.get('title')).toBe('final exam 2025')
    expect((uploaded.get('file') as File).name).toBe('final_exam-2025.pdf')
  })

  it('rejects unsupported files before uploading', async () => {
    signIn()
    const fetchMock = mockApi({
      'GET /api/users/me': { body: anna },
      [`GET /api/courses/${statistics.id}`]: { body: courseDetail },
      [`GET /api/courses/${statistics.id}/materials`]: { body: [] },
    })
    renderApp(`/courses/${statistics.id}`)

    await userEvent.click(await screen.findByRole('button', { name: 'Share the first file' }))
    const form = screen.getByRole('form', { name: 'Share a file' })
    // The file picker filters by type, but drag and drop does not, so validation must catch it.
    await userEvent.upload(within(form).getByLabelText('File'), new File(['<b>'], 'page.html'), { applyAccept: false })
    await userEvent.click(within(form).getByRole('button', { name: 'Share' }))

    expect(await within(form).findByText('Use PDF, an image, an Office document, text or ZIP')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'POST')).toBe(false)
  })
})
