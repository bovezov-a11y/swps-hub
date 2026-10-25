import { ShieldOff } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../features/auth/auth-context'
import type { Role } from '../lib/types'
import { EmptyState } from './EmptyState'
import { FullPageSpinner } from './Spinner'

export function RequireAuth() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
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

/** Staff pages. The API enforces the same rule; this only spares students an error screen. */
export function RequireRole({ roles }: { roles: Role[] }) {
  const { user } = useAuth()
  if (!user || !roles.includes(user.role)) {
    return <EmptyState icon={ShieldOff} title="Staff only" text="This page is for university moderators and administrators." />
  }
  return <Outlet />
}
