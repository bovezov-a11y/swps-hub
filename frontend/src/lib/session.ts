export type Session = {
  token: string
  expiresAt: string
}

const STORAGE_KEY = 'studenthub.session'

/** Persists the access token; storage can be unavailable (private mode), so every access is guarded. */
export const sessionStore = {
  get(): Session | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const session = JSON.parse(raw) as Session
      if (new Date(session.expiresAt).getTime() <= Date.now()) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }
      return session
    } catch {
      return null
    }
  },
  set(session: Session) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch {
      // Session stays in memory only.
    }
  },
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Nothing to clear.
    }
  },
}
