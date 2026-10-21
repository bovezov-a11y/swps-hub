import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../features/auth/auth-context'
import { FullPageSpinner } from './Spinner'

export function RequireAuth() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}

export function GuestOnly() {
  const { user, isLoading } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  if (isLoading) return <FullPageSpinner />
  if (user) return <Navigate to={from} replace />
  return <Outlet />
}
