import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { anna, emptyPage, mockApi } from '../../test/mock-api'
import { renderApp } from '../../test/render'

describe('authentication', () => {
  it('redirects guests from the dashboard to the login page', async () => {
    const router = renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('validates the registration form before calling the API', async () => {
    const fetchMock = mockApi({})
    renderApp('/register')

    await userEvent.click(await screen.findByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Enter your name')).toBeInTheDocument()
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument()
    expect(screen.getByText('Use at least 8 characters')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the server error when the email is already registered', async () => {
    mockApi({
      'POST /api/auth/register': {
        status: 409,
        body: { status: 409, detail: 'An account with this email already exists' },
      },
    })
    renderApp('/register')

    await userEvent.type(await screen.findByLabelText('Full name'), 'Anna Nowak')
    await userEvent.type(screen.getByLabelText('Email'), 'anna@swps.edu.pl')
    await userEvent.type(screen.getByLabelText('Password'), 'correct-horse')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('An account with this email already exists')
  })

  it('logs in and opens the dashboard', async () => {
    const fetchMock = mockApi({
      'POST /api/auth/login': {
        body: { token: 'token', expiresAt: new Date(Date.now() + 60_000).toISOString(), user: anna },
      },
      'GET /api/calendar': { body: [] },
      'GET /api/courses': { body: emptyPage },
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
