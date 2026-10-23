import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { anna, emptyPage, mockApi } from '../../test/mock-api'
import { renderApp } from '../../test/render'

const dashboardRoutes = {
  'GET /api/calendar': { body: [] },
  'GET /api/courses': { body: emptyPage },
  'GET /api/materials/feed': { body: [] },
}

async function fillRegistration(email: string, { acceptPrivacy = true } = {}) {
  await userEvent.type(await screen.findByLabelText('Full name'), 'Anna Nowak')
  await userEvent.type(screen.getByLabelText('University email'), email)
  await userEvent.type(screen.getByLabelText('Password'), 'correct-horse')
  if (acceptPrivacy) await userEvent.click(screen.getByRole('checkbox', { name: /accept the Privacy Policy/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
}

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
    expect(screen.getByText('Accept the privacy policy to continue')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('only accepts university email addresses', async () => {
    const fetchMock = mockApi({})
    renderApp('/register')

    await fillRegistration('anna@gmail.com')

    expect(await screen.findByText('Use your SWPS university email (@st.swps.edu.pl)')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('asks new students to confirm their email after registering', async () => {
    const fetchMock = mockApi({ 'POST /api/auth/register': { status: 202, body: { email: 'anna@st.swps.edu.pl' } } })
    renderApp('/register')

    await fillRegistration('anna@st.swps.edu.pl')

    expect(await screen.findByRole('heading', { name: 'Check your inbox' })).toBeInTheDocument()
    const [, init] = fetchMock.mock.calls.find(([url]) => url === '/api/auth/register')!
    expect(JSON.parse(init!.body as string)).toEqual({
      displayName: 'Anna Nowak',
      email: 'anna@st.swps.edu.pl',
      password: 'correct-horse',
      privacyPolicyVersion: '1.0',
    })
    expect(screen.getByText('anna@st.swps.edu.pl')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send a new link' })).toBeInTheDocument()
  })

  it('shows the server error when the email is already registered', async () => {
    mockApi({
      'POST /api/auth/register': {
        status: 409,
        body: { status: 409, detail: 'An account with this email already exists' },
      },
    })
    renderApp('/register')

    await fillRegistration('anna@st.swps.edu.pl')

    expect(await screen.findByRole('alert')).toHaveTextContent('An account with this email already exists')
  })

  it('logs the student in when they open the confirmation link', async () => {
    const fetchMock = mockApi({
      'POST /api/auth/verify-email': {
        body: { token: 'token', expiresAt: new Date(Date.now() + 60_000).toISOString(), user: anna },
      },
      ...dashboardRoutes,
    })
    const router = renderApp('/verify-email?token=abc123')

    expect(await screen.findByRole('heading', { name: /Hi, Anna/ })).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    const verifyCalls = fetchMock.mock.calls.filter(([url]) => url === '/api/auth/verify-email')
    expect(verifyCalls).toHaveLength(1)
    expect(JSON.parse(verifyCalls[0]![1]!.body as string)).toEqual({ token: 'abc123' })
  })

  it('offers a new link when the confirmation link has expired', async () => {
    mockApi({
      'POST /api/auth/verify-email': {
        status: 400,
        body: { status: 400, code: 'INVALID_VERIFICATION_TOKEN', detail: 'This confirmation link has expired.' },
      },
    })
    renderApp('/verify-email?token=old')

    expect(await screen.findByRole('heading', { name: 'Link not valid' })).toBeInTheDocument()
    expect(screen.getByText('This confirmation link has expired.')).toBeInTheDocument()
  })

  it('tells unconfirmed students to check their email when they log in', async () => {
    const fetchMock = mockApi({
      'POST /api/auth/login': {
        status: 403,
        body: { status: 403, code: 'EMAIL_NOT_VERIFIED', detail: 'Confirm your email address first.' },
      },
      'POST /api/auth/resend-verification': { status: 202 },
    })
    renderApp('/login')

    await userEvent.type(await screen.findByLabelText('Email'), 'anna@st.swps.edu.pl')
    await userEvent.type(screen.getByLabelText('Password'), 'correct-horse')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Send a new link' }))

    expect(await screen.findByText('New link sent. Check your inbox.')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/resend-verification', expect.objectContaining({ method: 'POST' }))
  })

  it('logs in and opens the dashboard', async () => {
    const fetchMock = mockApi({
      'POST /api/auth/login': {
        body: { token: 'token', expiresAt: new Date(Date.now() + 60_000).toISOString(), user: anna },
      },
      ...dashboardRoutes,
    })
    const router = renderApp('/login')

    await userEvent.type(await screen.findByLabelText('Email'), 'anna@st.swps.edu.pl')
    await userEvent.type(screen.getByLabelText('Password'), 'correct-horse')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('heading', { name: /Hi, Anna/ })).toBeInTheDocument()
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }))
  })
})
