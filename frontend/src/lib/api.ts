import { sessionStore } from './session'

/** RFC 9457 problem detail returned by the backend for every error. */
type ProblemDetail = {
  status: number
  title?: string
  detail?: string
  errors?: Record<string, string>
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
}

let unauthorizedHandler: (() => void) | null = null

/** Called when a request made with a token is rejected, i.e. the session expired or was revoked. */
export function onUnauthorized(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

export async function api<T>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  const session = sessionStore.get()
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (session) headers.Authorization = `Bearer ${session.token}`

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetail | null
    if (response.status === 401 && session) unauthorizedHandler?.()
    throw new ApiError(
      response.status,
      problem?.detail ?? problem?.title ?? 'Something went wrong. Please try again.',
      problem?.errors,
    )
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
