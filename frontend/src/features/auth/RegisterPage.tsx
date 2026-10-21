import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { FormAlert } from '../../components/FormAlert'
import { TextField } from '../../components/TextField'
import { useAuth } from './auth-context'
import { applyServerErrors } from './form-errors'
import { registerSchema, type RegisterInput } from './schemas'

export function RegisterPage() {
  const { register: createAccount } = useAuth()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createAccount(values)
    } catch (error) {
      applyServerErrors(error, ['displayName', 'email', 'password'], setError)
    }
  })

  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>
      <p className="mt-2 text-sm text-slate-600">Join your courses and keep your semester organised.</p>

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
