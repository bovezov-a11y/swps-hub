import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { FormAlert } from '../../components/FormAlert'
import { TextField } from '../../components/fields'
import { applyServerErrors } from '../../lib/form-errors'
import { useAuth } from './auth-context'
import { ResendLinkButton } from './ResendLinkButton'
import { registerSchema, universityDomains, type RegisterInput } from './schemas'

export function RegisterPage() {
  const { register: createAccount } = useAuth()
  const [sentTo, setSentTo] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSentTo(await createAccount(values))
    } catch (error) {
      applyServerErrors(error, ['displayName', 'email', 'password'], setError)
    }
  })

  if (sentTo) return <CheckInbox email={sentTo} />

  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>
      <p className="mt-2 text-sm text-slate-600">For SWPS students only: sign up with your university email.</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        {errors.root && <FormAlert message={errors.root.message} />}
        <TextField
          label="Full name"
          autoComplete="name"
          placeholder="Anna Nowak"
          error={errors.displayName?.message}
          {...register('displayName')}
        />
        <TextField
          label="University email"
          type="email"
          autoComplete="email"
          placeholder={`you@${universityDomains[0]}`}
          hint="We will send you a link to confirm it."
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters."
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Log in
        </Link>
      </p>
    </>
  )
}

function CheckInbox({ email }: { email: string }) {
  return (
    <div className="text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
        <MailCheck className="size-7" aria-hidden="true" />
      </span>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight">Check your inbox</h2>
      <p className="mt-3 text-sm text-slate-600">
        We sent a confirmation link to <span className="font-semibold text-slate-900">{email}</span>. Open it to
        activate your account. The link is valid for 24 hours.
      </p>
      <p className="mt-8 text-sm text-slate-600">
        No email? Check your spam folder or <ResendLinkButton email={email} />
      </p>
      <p className="mt-4 text-sm">
        <Link to="/login" className="font-semibold text-slate-600 hover:text-slate-900">
          Back to login
        </Link>
      </p>
    </div>
  )
}
