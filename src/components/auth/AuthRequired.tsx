import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { useThemeColors } from '../../hooks/useThemeColors'
import { StatePanel } from '../feedback/StatePanel'
import { Button } from '../ui/Button'

/**
 * Guards a screen behind a session. Unlike the web `AuthRequired` this does not redirect — a tab can
 * be selected at any time, so it renders a sign-in prompt in place and keeps the tab bar usable.
 */
export function AuthRequired({
  body = 'Sign in to pick up where you left off.',
  children,
  title = 'Sign in to continue',
}: {
  body?: string
  children: ReactNode
  title?: string
}) {
  const { status } = useAuth()
  const colors = useThemeColors()

  if (status === 'checking') {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.accent} />
      </View>
    )
  }

  if (status === 'guest') {
    return (
      <View className="flex-1 justify-center p-4">
        <StatePanel
          action={<Button label="Sign in" onPress={() => router.push('/login')} />}
          body={body}
          title={title}
          tone="info"
        />
      </View>
    )
  }

  return <>{children}</>
}
