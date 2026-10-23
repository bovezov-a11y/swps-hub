import { createContext, useContext } from 'react'
import type { User } from '../../lib/types'
import type { LoginInput, RegisterInput } from './schemas'

export type AuthContextValue = {
  user: User | null
  isLoading: boolean
  login: (input: LoginInput) => Promise<void>
  /** Creates the account and resolves with the address the confirmation link was sent to. */
  register: (input: RegisterInput) => Promise<string>
  verifyEmail: (token: string) => Promise<void>
  resendVerification: (email: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
