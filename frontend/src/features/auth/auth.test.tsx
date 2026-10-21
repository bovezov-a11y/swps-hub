import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderApp } from '../../test/render'

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const anna = {
  id: '6f1c2c1e-0000-4000-8000-000000000001',
  email: 'anna@swps.edu.pl',
  displayName: 'Anna Nowak',
  role: 'STUDENT',
  createdAt: '2026-10-01T10:00:00Z',
}

describe('authentication', () => {
  it('redirects guests from the dashboard to the login page', async () => {
    const router = renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('validates the registration form before calling the API', async () => {
    const fetchMock = mockFetch(500, {})
    renderApp('/register')

    await userEvent.click(await screen.findByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Enter your name')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument()
    expect(screen.getByText('Use at least 8 characters')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the server error when the email is already registered', async () => {
    mockFetch(409, { status: 409, detail: 'An account with this email already exists' })
    renderApp('/register')

    await userEvent.type(await screen.findByLabelText('Full name'), 'Anna Nowak')
    await userEvent.type(screen.getByLabelText('Email'), 'anna@swps.edu.pl')
    await userEvent.type(screen.getByLabelText('Password'), 'correct-horse')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('An account with this email already exists')
  })

  it('logs in and opens the dashboard', async () => {
    const fetchMock = mockFetch(200, {
      token: 'token',
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
      user: anna,
    })
    const router = renderApp('/login')

    await userEvent.type(await screen.findByLabelText('Email'), 'anna@swps.edu.pl')
    await userEvent.type(screen.getByLabelText('Password'), 'correct-horse')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('heading', { name: /Hi, Anna/ })).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }))
  })
})
