import { useState } from 'react'
import { useAuth } from './auth-context'

/** Asks for a fresh confirmation email; the backend ignores repeats within a minute. */
export function ResendLinkButton({ email }: { email: string }) {
  const { resendVerification } = useAuth()
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')

  const resend = async () => {
    setState('sending')
    try {
      await resendVerification(email)
      setState('sent')
    } catch {
      setState('failed')
    }
  }

  if (state === 'sent') {
    return <span className="font-semibold text-emerald-700">New link sent. Check your inbox.</span>
  }
  return (
    <button
      type="button"
      onClick={resend}
      disabled={state === 'sending'}
      className="font-semibold text-indigo-600 hover:text-indigo-500 disabled:opacity-60"
    >
      {state === 'failed' ? 'Could not send. Try again' : state === 'sending' ? 'Sending…' : 'Send a new link'}
    </button>
  )
}
