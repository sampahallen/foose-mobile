import Constants from 'expo-constants'

/**
 * Mirrors `frontend/src/config/env.ts`. Expo inlines only `EXPO_PUBLIC_*` variables at build
 * time, so anything configurable lives there (or in `app.json` -> `expo.extra`).
 */
function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/$/, '')
}

function extra<T>(key: string): T | undefined {
  const config = Constants.expoConfig?.extra as Record<string, unknown> | undefined
  return config?.[key] as T | undefined
}

/**
 * In Expo Go / dev client the packager URI carries the dev machine's LAN address, which is what a
 * physical phone must call — `localhost` there points at the phone itself. Reuse that host with the
 * backend port so `npm run dev` in `backend/` works on-device with zero configuration.
 */
function devServerApiBase(): string | null {
  const hostUri = Constants.expoConfig?.hostUri || (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost
  const host = hostUri?.split(':')[0]
  if (!host) return null
  const port = extra<string | number>('apiPort') || 5000
  return `http://${host}:${port}/api`
}

/** Base URL for REST calls, including the `/api` prefix (matches the Express mounts). */
export function getApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL
  if (typeof fromEnv === 'string' && fromEnv.trim()) return normalizeBaseUrl(fromEnv)

  if (__DEV__) {
    const fromPackager = devServerApiBase()
    if (fromPackager) return normalizeBaseUrl(fromPackager)
  }

  const fromConfig = extra<string>('apiBaseUrl')
  if (typeof fromConfig === 'string' && fromConfig.trim()) return normalizeBaseUrl(fromConfig)

  console.warn('[config] EXPO_PUBLIC_API_BASE_URL is not set. Falling back to http://localhost:5000/api.')
  return 'http://localhost:5000/api'
}

/** Socket.IO connects to the API origin without the `/api` suffix. */
export function getSocketBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_SOCKET_URL
  if (typeof fromEnv === 'string' && fromEnv.trim()) return normalizeBaseUrl(fromEnv)
  return normalizeBaseUrl(getApiBaseUrl().replace(/\/api$/, ''))
}

export function getAppName(): string {
  const name = process.env.EXPO_PUBLIC_APP_NAME
  return typeof name === 'string' && name.trim() ? name.trim() : 'Foose'
}

/** Distinct from the web app's `thrift.auth.tokens` so a shared device keeps sessions separate. */
export function getAuthStorageKey(): string {
  const key = process.env.EXPO_PUBLIC_AUTH_STORAGE_KEY
  return typeof key === 'string' && key.trim() ? key.trim() : 'foose.mobile.auth.tokens'
}

export function getCartStorageKey(): string {
  const key = process.env.EXPO_PUBLIC_CART_STORAGE_KEY
  return typeof key === 'string' && key.trim() ? key.trim() : 'foose.mobile.cart'
}

export function getThemeStorageKey(): string {
  return 'foose.mobile.theme'
}
