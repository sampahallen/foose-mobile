import { getApiBaseUrl } from '../../config/env'
import type { ApiEnvelope, AuthPayload, AuthTokens } from '../../types/api'
import { ApiError } from './errors'
import { clearStoredTokens, getStoredTokens, storeTokens } from './tokens'

export type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  /** When false, do not send the Bearer token (login, register, refresh). */
  auth?: boolean
  /** Internal: prevents a refreshed request from recursing on another 401. */
  retriedAfterRefresh?: boolean
}

type SessionExpiredListener = () => void

const sessionExpiredListeners = new Set<SessionExpiredListener>()
let refreshInFlight: Promise<AuthTokens | null> | null = null

/**
 * Auth state lives in `AuthContext`, but the client is the first place a dead session shows up.
 * The context subscribes here so a failed refresh drops the user to guest exactly once.
 */
export function onSessionExpired(listener: SessionExpiredListener) {
  sessionExpiredListeners.add(listener)
  return () => sessionExpiredListeners.delete(listener)
}

function notifySessionExpired() {
  sessionExpiredListeners.forEach((listener) => listener())
}

async function parseJsonBody(response: Response): Promise<unknown | null> {
  if (response.status === 204 || response.status === 205 || response.headers.get('content-length') === '0') {
    return null
  }

  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

/**
 * Access tokens last 3 days and mobile sessions outlive that, so a 401 triggers one shared refresh
 * (single-flight: parallel requests await the same swap instead of racing the rotating refresh
 * token, which the backend invalidates on use).
 */
async function refreshSession(): Promise<AuthTokens | null> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const refreshToken = getStoredTokens()?.refreshToken
    if (!refreshToken) return null

    try {
      const payload = await apiRequest<AuthPayload>('/auth/refresh', {
        auth: false,
        body: { refreshToken },
        method: 'POST',
      })
      await storeTokens(payload.tokens)
      return payload.tokens
    } catch {
      await clearStoredTokens()
      notifySessionExpired()
      return null
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const base = getApiBaseUrl()
  const headers = new Headers(options.headers)
  const tokens = getStoredTokens()
  const isFormData = options.body instanceof FormData

  if (!isFormData && options.body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.auth !== false && tokens?.accessToken) {
    headers.set('Authorization', `Bearer ${tokens.accessToken}`)
  }

  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`

  const response = await fetch(url, {
    ...options,
    body: isFormData ? (options.body as FormData) : options.body === undefined ? undefined : JSON.stringify(options.body),
    headers,
  } as RequestInit)

  const payload = (await parseJsonBody(response)) as ApiEnvelope<T> | null

  if (!response.ok) {
    if (response.status === 401 && options.auth !== false && !options.retriedAfterRefresh && tokens?.refreshToken) {
      const refreshed = await refreshSession()
      if (refreshed) {
        return apiRequest<T>(path, { ...options, retriedAfterRefresh: true })
      }
    }

    const message =
      payload && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : response.statusText || 'Request failed'
    const details = payload && 'details' in payload ? payload.details : undefined
    throw new ApiError(message, response.status, details)
  }

  if (payload === null) {
    return null as T
  }

  if (typeof payload === 'object' && payload !== null && 'success' in payload) {
    if (payload.success === false) {
      throw new ApiError(payload.error, response.status, payload.details)
    }

    return payload.data
  }

  return payload as T
}

export function apiGet<T>(path: string, options?: RequestOptions) {
  return apiRequest<T>(path, { ...options, method: 'GET' })
}

export function apiPost<T>(path: string, body?: unknown, options?: RequestOptions) {
  return apiRequest<T>(path, { ...options, body, method: 'POST' })
}

export function apiPut<T>(path: string, body?: unknown, options?: RequestOptions) {
  return apiRequest<T>(path, { ...options, body, method: 'PUT' })
}

export function apiDelete<T>(path: string, options?: RequestOptions) {
  return apiRequest<T>(path, { ...options, method: 'DELETE' })
}
