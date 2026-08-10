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

export default function RegisterScreen() {
  const { register } = useAuth()
  const [form, setForm] = useState({ email: '', name: '', password: '', phone: '', username: '' })
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit() {
    if (submitting) return
    setSubmitting(true)
    setError('')

    try {
      await register({
        email: form.email.trim(),
        name: form.name.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        username: form.username.trim(),
      })
      setSubmitted(true)
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to create your account'))
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <Screen edges={['top', 'bottom']}>
        <TopBar showBack showCart={false} showSearch={false} title="Check your email" />
        <View className="gap-4 p-4">
          <InlineNotice title="Account created" tone="success">
            We sent a verification link to {form.email.trim()}. Verify your email to message sellers, check out, and open a
            DigiShop — you can browse and save in the meantime.
          </InlineNotice>
          <Button full label="Go to sign in" onPress={() => router.replace('/login')} />
        </View>
      </Screen>
    )
  }

  const canSubmit = Boolean(form.name.trim() && form.email.trim() && form.username.trim() && form.password)

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar showBack showCart={false} showSearch={false} title="Create account" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="gap-4 p-4 pb-10" keyboardShouldPersistTaps="handled">
          {!!error && <InlineNotice title="Registration failed" tone="error">{error}</InlineNotice>}

          <Input autoComplete="name" label="Full name" onChangeText={(value) => update('name', value)} placeholder="Ama Mensah" value={form.name} />
          <Input
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            label="Email"
            onChangeText={(value) => update('email', value)}
            placeholder="you@example.com"
            value={form.email}
          />
          <Input
            autoCapitalize="none"
            autoCorrect={false}
            hint="Your public @handle on Foose."
            label="Username"
            onChangeText={(value) => update('username', value)}
            placeholder="amamensah"
            value={form.username}
          />
          <Input
            autoComplete="tel"
            keyboardType="phone-pad"
            label="Phone (optional)"
            onChangeText={(value) => update('phone', value)}
            placeholder="024 000 0000"
            value={form.phone}
          />
          <Input
            autoCapitalize="none"
            autoComplete="new-password"
            label="Password"
            onChangeText={(value) => update('password', value)}
            secureTextEntry
            value={form.password}
          />

          <Button disabled={!canSubmit} full label="Create account" loading={submitting} onPress={() => void submit()} />

          <View className="flex-row items-center justify-center gap-1">
            <Text className="text-sm text-foose-muted">Already have an account?</Text>
            <Button label="Sign in" onPress={() => router.replace('/login')} size="sm" variant="ghost" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  )
}
