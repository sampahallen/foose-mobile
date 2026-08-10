import AsyncStorage from '@react-native-async-storage/async-storage'
import { colorScheme, useColorScheme } from 'nativewind'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getThemeStorageKey } from '../config/env'
import { ThemeContext, type ThemePreference } from './theme-context'

function isPreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

/**
 * The web app stores the same three-way choice on `User.preferences.theme` and flips
 * `[data-theme]`; here NativeWind's `colorScheme` drives the `.dark` class that `global.css`
 * keys the dark palette off.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { colorScheme: active } = useColorScheme()
  const [preference, setPreferenceState] = useState<ThemePreference>('system')

  useEffect(() => {
    async function hydrate() {
      const stored = await AsyncStorage.getItem(getThemeStorageKey()).catch(() => null)
      if (isPreference(stored)) {
        setPreferenceState(stored)
        colorScheme.set(stored)
      } else {
        colorScheme.set('system')
      }
    }

    void hydrate()
  }, [])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    colorScheme.set(next)
    void AsyncStorage.setItem(getThemeStorageKey(), next).catch(() => undefined)
  }, [])

  const value = useMemo(
    () => ({ activeScheme: active === 'dark' ? ('dark' as const) : ('light' as const), preference, setPreference }),
    [active, preference, setPreference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
