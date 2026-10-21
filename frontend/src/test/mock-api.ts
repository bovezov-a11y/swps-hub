import { vi } from 'vitest'

type MockResponse = { status?: number; body?: unknown }
type Handler = MockResponse | ((request: { url: URL; body: unknown }) => MockResponse)

/**
 * Replaces `fetch` with a fake backend. Routes are keyed by "METHOD /api/path" (query string ignored);
 * unknown routes answer 404 so a missing mock shows up as an error state instead of hanging.
 */
export function mockApi(routes: Record<string, Handler>) {
  const fetchMock = vi.fn(async (input: string, init: RequestInit = {}) => {
    const url = new URL(input, 'http://localhost')
    const handler = routes[`${init.method ?? 'GET'} ${url.pathname}`]
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined
    const { status = 200, body: responseBody } =
      typeof handler === 'function' ? handler({ url, body }) : (handler ?? { status: 404, body: { status: 404 } })
    if (status === 204) return new Response(null, { status })
    return new Response(JSON.stringify(responseBody ?? null), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export const anna = {
  id: '6f1c2c1e-0000-4000-8000-000000000001',
  email: 'anna@swps.edu.pl',
  displayName: 'Anna Nowak',
  role: 'STUDENT',
  createdAt: '2026-10-01T10:00:00Z',
}

export const emptyPage = { items: [], page: 0, size: 20, totalItems: 0, totalPages: 0 }

export const programs = [
  { id: 'p0000000-0000-4000-8000-000000000001', slug: 'psychology', name: 'Psychology', courseCount: 2 },
  { id: 'p0000000-0000-4000-8000-000000000002', slug: 'computer-science', name: 'Computer Science', courseCount: 0 },
]

export const statistics = {
  id: 'c0000000-0000-4000-8000-000000000001',
  code: 'STA-201',
  name: 'Statistics in Psychology',
  program: { id: programs[0]!.id, slug: 'psychology', name: 'Psychology' },
  studyYear: 2,
  term: 'WINTER',
  lecturer: 'Dr Kowalska',
  memberCount: 12,
  materialCount: 3,
  enrolled: false,
}

/** Starts the test signed in as Anna. */
export function signIn() {
  localStorage.setItem(
    'studenthub.session',
    JSON.stringify({ token: 'token', expiresAt: new Date(Date.now() + 3_600_000).toISOString() }),
  )
}
