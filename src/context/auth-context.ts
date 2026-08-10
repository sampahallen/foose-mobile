import { createContext } from 'react'
import type { AuthTokens, User } from '../types/api'

export type AuthStatus = 'checking' | 'authenticated' | 'guest'

export type AuthContextValue = {
  completeOAuth: (tokens: AuthTokens) => Promise<void>
  login: (payload: { identifier: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<User>
  register: (payload: {
    name: string
    email: string
    username: string
    password: string
    phone?: string
    location?: { region?: string; city?: string }
  }) => Promise<void>
  status: AuthStatus
  user: User | null
}

export const AuthContext = createContext<AuthContextValue | null>(null)
