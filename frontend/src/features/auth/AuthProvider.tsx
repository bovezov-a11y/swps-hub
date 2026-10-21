import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, onUnauthorized } from '../../lib/api'
import { sessionStore } from '../../lib/session'
import type { AuthResponse, User } from '../../lib/types'
import { AuthContext, type AuthContextValue } from './auth-context'
import type { LoginInput, RegisterInput } from './schemas'

const currentUserKey = ['users', 'me'] as const

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState(() => sessionStore.get())

  const currentUser = useQuery({
    queryKey: currentUserKey,
    queryFn: () => api<User>('/users/me'),
    enabled: session !== null,
    staleTime: 5 * 60_000,
    retry: false,
  })

  const logout = useCallback(() => {
    sessionStore.clear()
    setSession(null)
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    onUnauthorized(logout)
    return () => onUnauthorized(null)
  }, [logout])

  const startSession = useCallback(
    (response: AuthResponse) => {
      const next = { token: response.token, expiresAt: response.expiresAt }
      sessionStore.set(next)
      queryClient.setQueryData(currentUserKey, response.user)
      setSession(next)
    },
    [queryClient],
  )

  const login = useCallback(
    async (input: LoginInput) => startSession(await api<AuthResponse>('/auth/login', { method: 'POST', body: input })),
    [startSession],
  )

  const register = useCallback(
    async (input: RegisterInput) =>
      startSession(await api<AuthResponse>('/auth/register', { method: 'POST', body: input })),
    [startSession],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session ? (currentUser.data ?? null) : null,
      isLoading: session !== null && currentUser.isPending,
      login,
      register,
      logout,
    }),
    [session, currentUser.data, currentUser.isPending, login, register, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
