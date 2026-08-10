import { router } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { InlineNotice } from '../components/feedback/InlineNotice'
import { Screen } from '../components/layout/Screen'
import { TopBar } from '../components/layout/TopBar'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/errorMessage'

export default function LoginScreen() {
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (submitting) return
    setSubmitting(true)
    setError('')

    try {
      await login({ identifier: identifier.trim(), password })
      if (router.canGoBack()) router.back()
      else router.replace('/')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to sign in'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar showBack showCart={false} showSearch={false} title="Sign in" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="gap-4 p-4" keyboardShouldPersistTaps="handled">
          <Text className="text-sm text-foose-muted">
            Use the email, username, or phone number on your Foose account.
          </Text>

          {!!error && <InlineNotice title="Sign in failed" tone="error">{error}</InlineNotice>}

          <Input
            autoCapitalize="none"
            autoComplete="username"
            autoCorrect={false}
            label="Email, username, or phone"
            onChangeText={setIdentifier}
            placeholder="you@example.com"
            value={identifier}
          />
          <Input
            autoCapitalize="none"
            autoComplete="current-password"
            label="Password"
            onChangeText={setPassword}
            onSubmitEditing={() => void submit()}
            placeholder="Your password"
            returnKeyType="go"
            secureTextEntry
            value={password}
          />

          <Button
            disabled={!identifier.trim() || !password}
            full
            label="Sign in"
            loading={submitting}
            onPress={() => void submit()}
          />

          <View className="flex-row items-center justify-center gap-1">
            <Text className="text-sm text-foose-muted">New to Foose?</Text>
            <Button label="Create an account" onPress={() => router.replace('/register')} size="sm" variant="ghost" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
