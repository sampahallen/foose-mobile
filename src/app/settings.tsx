import { router } from 'expo-router'
import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { Screen } from '../components/layout/Screen'
import { TopBar } from '../components/layout/TopBar'
import { Button } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'
import { getApiBaseUrl, getAppName } from '../config/env'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import type { ThemePreference } from '../context/theme-context'

const THEMES: { label: string; value: ThemePreference }[] = [
  { label: 'System', value: 'system' },
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
]

export default function SettingsScreen() {
  const { logout, status, user } = useAuth()
  const { preference, setPreference } = useTheme()
  const [signingOut, setSigningOut] = useState(false)

  async function signOut() {
    setSigningOut(true)
    try {
      await logout()
      router.replace('/')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar showBack showCart={false} showSearch={false} title="Settings" />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-10">
        <View className="gap-3 rounded-xl border border-foose-border bg-foose-surface p-4">
          <Text className="text-sm font-black text-foose-text">Appearance</Text>
          <View className="flex-row gap-2">
            {THEMES.map((option) => (
              <Chip
                active={preference === option.value}
                key={option.value}
                label={option.label}
                onPress={() => setPreference(option.value)}
              />
            ))}
          </View>
        </View>

        {!!user && (
          <View className="gap-1.5 rounded-xl border border-foose-border bg-foose-surface p-4">
            <Text className="text-sm font-black text-foose-text">Account</Text>
            <Text className="text-xs text-foose-muted">{user.email}</Text>
            <Text className="text-xs text-foose-muted">@{user.username}</Text>
            <Text className="text-xs text-foose-faint">
              Profile edits, email changes, and account deactivation are handled on the web app.
            </Text>
          </View>
        )}

        <View className="gap-1.5 rounded-xl border border-foose-border bg-foose-surface p-4">
          <Text className="text-sm font-black text-foose-text">About</Text>
          <Text className="text-xs text-foose-muted">{getAppName()} mobile</Text>
          <Text className="text-xs text-foose-faint" numberOfLines={1}>
            API: {getApiBaseUrl()}
          </Text>
        </View>

        {status === 'authenticated' ? (
          <Button full label="Sign out" loading={signingOut} onPress={() => void signOut()} variant="danger" />
        ) : (
          <Button full label="Sign in" onPress={() => router.push('/login')} />
        )}
      </ScrollView>
    </Screen>
  )
}
