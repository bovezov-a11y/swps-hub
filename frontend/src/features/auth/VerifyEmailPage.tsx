import { MailWarning } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Spinner } from '../../components/Spinner'
import { TextField } from '../../components/fields'
import { ApiError } from '../../lib/api'
import { useAuth } from './auth-context'
import { ResendLinkButton } from './ResendLinkButton'

/** Opened from the confirmation email. On success the user is logged in and leaves this page automatically. */
export function VerifyEmailPage() {
  const { verifyEmail } = useAuth()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [error, setError] = useState<string | null>(token ? null : 'This link is missing its confirmation code.')
  // Tokens work once, so the request must not repeat when React runs effects twice in development.
  const started = useRef(false)

  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    verifyEmail(token).catch((reason: unknown) =>
      setError(reason instanceof ApiError ? reason.message : 'Could not reach the server. Please try again.'),
    )
  }, [token, verifyEmail])

  if (!error) {
    return (
      <div className="flex flex-col items-center gap-4 text-center text-slate-600" role="status">
        <Spinner className="size-8 text-indigo-600" />
        Confirming your email…
      </div>
    )
  }
  return <ExpiredLink message={error} />
}

function ExpiredLink({ message }: { message: string }) {
  const [email, setEmail] = useState('')
  return (
    <div className="text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
        <MailWarning className="size-7" aria-hidden="true" />
      </span>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight">Link not valid</h2>
      <p className="mt-3 text-sm text-slate-600">{message}</p>
      <div className="mt-8 text-left">
        <TextField
          label="University email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@st.swps.edu.pl"
        />
        {email.includes('@') && (
          <p className="mt-3 text-sm">
            <ResendLinkButton email={email} />
          </p>
        )}
      </div>
      <p className="mt-8 text-sm">
        <Link to="/login" className="font-semibold text-slate-600 hover:text-slate-900">
          Back to login
        </Link>
      </p>
    </div>
  )
}
