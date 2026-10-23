import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { FormAlert } from '../../components/FormAlert'
import { TextField } from '../../components/fields'
import { ApiError } from '../../lib/api'
import { applyServerErrors } from '../../lib/form-errors'
import { useAuth } from './auth-context'
import { ResendLinkButton } from './ResendLinkButton'
import { loginSchema, type LoginInput } from './schemas'

export function LoginPage() {
  const { login } = useAuth()
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setUnverifiedEmail(null)
    try {
      await login(values)
    } catch (error) {
      if (error instanceof ApiError && error.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(values.email)
        return
      }
      applyServerErrors(error, ['email', 'password'], setError)
    }
  })

  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
      <p className="mt-2 text-sm text-slate-600">Log in to see your courses and upcoming exams.</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        {errors.root && <FormAlert message={errors.root.message} />}
        {unverifiedEmail && (
          <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Confirm your email first: open the link we sent to <strong>{unverifiedEmail}</strong>.{' '}
            <ResendLinkButton email={unverifiedEmail} />
          </div>
        )}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@st.swps.edu.pl"
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Log in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-600">
        New here?{' '}
        <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
          Create an account
        </Link>
      </p>
    </>
  )
}
