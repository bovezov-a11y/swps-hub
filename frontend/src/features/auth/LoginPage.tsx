import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { FormAlert } from '../../components/FormAlert'
import { TextField } from '../../components/fields'
import { useAuth } from './auth-context'
import { applyServerErrors } from '../../lib/form-errors'
import { loginSchema, type LoginInput } from './schemas'

export function LoginPage() {
  const { login } = useAuth()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login(values)
    } catch (error) {
      applyServerErrors(error, ['email', 'password'], setError)
    }
  })

  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
      <p className="mt-2 text-sm text-slate-600">Log in to see your courses and upcoming exams.</p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-5">
        {errors.root && <FormAlert message={errors.root.message} />}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@swps.edu.pl"
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
