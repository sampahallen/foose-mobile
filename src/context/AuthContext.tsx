import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  apiGet,
  apiPost,
  clearStoredTokens,
  getStoredTokens,
  hydrateTokens,
  onSessionExpired,
  storeTokens,
} from '../lib/api'
import type { AuthPayload, AuthTokens, User } from '../types/api'
import { AuthContext, type AuthStatus } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('checking')
  const [user, setUser] = useState<User | null>(null)

  const applyAuth = useCallback(async (payload: AuthPayload) => {
    await storeTokens(payload.tokens)
    setUser(payload.user)
    setStatus('authenticated')
  }, [])

  const becomeGuest = useCallback(async () => {
    await clearStoredTokens()
    setUser(null)
    setStatus('guest')
  }, [])

  const refreshUser = useCallback(async () => {
    const data = await apiGet<{ user: User }>('/users/me')
    setUser(data.user)
    setStatus('authenticated')
    return data.user
  }, [])

  // The client drops to guest on a failed token refresh; keep context state in step with it.
  useEffect(() => {
    const unsubscribe = onSessionExpired(() => {
      setUser(null)
      setStatus('guest')
    })
    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    async function boot() {
      // Tokens live in SecureStore, so the first read is async — every request below waits on it.
      const tokens = await hydrateTokens()

      if (!tokens?.accessToken) {
        await becomeGuest()
        return
      }

      try {
        await refreshUser()
      } catch {
        if (!getStoredTokens()?.refreshToken) {
          await becomeGuest()
          return
        }

        try {
          await refreshUser()
        } catch {
          await becomeGuest()
        }
      }
    }

    void boot()
  }, [becomeGuest, refreshUser])

  const login = useCallback(
    async (payload: { identifier: string; password: string }) => {
      await applyAuth(await apiPost<AuthPayload>('/auth/login', payload, { auth: false }))
    },
    [applyAuth],
  )

  const register = useCallback(
    async (payload: {
      name: string
      email: string
      username: string
      password: string
      phone?: string
      location?: { region?: string; city?: string }
    }) => {
      await apiPost('/auth/register', payload, { auth: false })
    },
    [],
  )

  const completeOAuth = useCallback(async (tokens: AuthTokens) => {
    await storeTokens(tokens)
    setStatus('checking')
    try {
      await refreshUser()
    } catch {
      await becomeGuest()
    }
  }, [becomeGuest, refreshUser])

  const logout = useCallback(async () => {
    const refreshToken = getStoredTokens()?.refreshToken

    try {
      await apiPost('/auth/logout', { refreshToken })
    } catch {
      // Local logout still wins if the server cannot be reached.
    } finally {
      await becomeGuest()
    }
  }, [becomeGuest])

  const value = useMemo(
    () => ({ completeOAuth, login, logout, refreshUser, register, status, user }),
    [completeOAuth, login, logout, refreshUser, register, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
