import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { getAuthStorageKey } from '../../config/env'
import type { AuthTokens } from '../../types/api'

/**
 * The web app reads tokens synchronously from `localStorage`; React Native has no synchronous
 * store, so tokens are cached in memory after `hydrateTokens()` runs during boot and every write
 * updates the cache before it hits the device. Requests therefore stay synchronous at the call site.
 *
 * SecureStore (Keychain/Keystore) holds the tokens on device. It is unavailable on web, where the
 * app falls back to AsyncStorage (localStorage under the hood) exactly like `frontend/`.
 */
let cachedTokens: AuthTokens | null = null
let hydrated = false

const useSecureStore = Platform.OS !== 'web'

async function readRaw(key: string) {
  if (!useSecureStore) return AsyncStorage.getItem(key)
  try {
    return await SecureStore.getItemAsync(key)
  } catch {
    return null
  }
}

async function writeRaw(key: string, value: string) {
  if (!useSecureStore) return AsyncStorage.setItem(key, value)
  return SecureStore.setItemAsync(key, value)
}

async function deleteRaw(key: string) {
  if (!useSecureStore) return AsyncStorage.removeItem(key)
  return SecureStore.deleteItemAsync(key)
}

/** Loads persisted tokens into memory. Call once, before the first authenticated request. */
export async function hydrateTokens(): Promise<AuthTokens | null> {
  if (hydrated) return cachedTokens

  const key = getAuthStorageKey()
  const raw = await readRaw(key)
  hydrated = true

  if (!raw) {
    cachedTokens = null
    return null
  }

  try {
    cachedTokens = JSON.parse(raw) as AuthTokens
  } catch {
    cachedTokens = null
    await deleteRaw(key).catch(() => undefined)
  }

  return cachedTokens
}

export function getStoredTokens(): AuthTokens | null {
  return cachedTokens
}

export async function storeTokens(tokens: AuthTokens) {
  cachedTokens = tokens
  hydrated = true
  await writeRaw(getAuthStorageKey(), JSON.stringify(tokens)).catch(() => undefined)
}

export async function clearStoredTokens() {
  cachedTokens = null
  hydrated = true
  await deleteRaw(getAuthStorageKey()).catch(() => undefined)
}
