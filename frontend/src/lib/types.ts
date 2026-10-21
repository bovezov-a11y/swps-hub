export type Role = 'STUDENT' | 'MODERATOR' | 'ADMIN'

export type User = {
  id: string
  email: string
  displayName: string
  role: Role
  createdAt: string
}

export type AuthResponse = {
  token: string
  expiresAt: string
  user: User
}
