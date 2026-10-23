import { sessionStore } from './session'

/** RFC 9457 problem detail returned by the backend for every error. */
type ProblemDetail = {
  status: number
  title?: string
  detail?: string
  errors?: Record<string, string>
  /** Machine-readable reason for errors the UI reacts to, e.g. EMAIL_NOT_VERIFIED. */
  code?: string
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>
  readonly code: string | undefined

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.code = code
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Sent as JSON, or as multipart form data when it is a FormData. */
  body?: unknown
}

let unauthorizedHandler: (() => void) | null = null

/** Called when a request made with a token is rejected, i.e. the session expired or was revoked. */
export function onUnauthorized(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options, 'application/json')
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/** Downloads a protected file. Links cannot carry the bearer token, so files are fetched and handed over as blobs. */
export async function apiBlob(path: string): Promise<Blob> {
  const response = await send(path, {}, '*/*')
  return response.blob()
}

async function send(path: string, { method = 'GET', body }: RequestOptions, accept: string) {
  const session = sessionStore.get()
  const headers: Record<string, string> = { Accept: accept }
  const isForm = body instanceof FormData
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  if (session) headers.Authorization = `Bearer ${session.token}`

  const response = await fetch(`/api${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
  })

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as ProblemDetail | null
    if (response.status === 401 && session) unauthorizedHandler?.()
    throw new ApiError(
      response.status,
      problem?.detail ?? problem?.title ?? 'Something went wrong. Please try again.',
      problem?.errors,
      problem?.code,
    )
  }
  return response
}
