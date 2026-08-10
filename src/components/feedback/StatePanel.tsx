import { Ionicons } from '@expo/vector-icons'
import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { useThemeColors } from '../../hooks/useThemeColors'

type Tone = 'empty' | 'error' | 'info' | 'success'

const icons: Record<Tone, keyof typeof Ionicons.glyphMap> = {
  empty: 'file-tray-outline',
  error: 'alert-circle-outline',
  info: 'information-circle-outline',
  success: 'checkmark-circle-outline',
}

/** Mirrors the web `StatePanel`: one component for empty, error, info, and success states. */
export function StatePanel({
  action,
  body,
  className = '',
  title,
  tone = 'empty',
}: {
  action?: ReactNode
  body?: string
  className?: string
  title: string
  tone?: Tone
}) {
  const colors = useThemeColors()
  const iconColor = tone === 'error' ? colors.danger : tone === 'success' ? colors.success : colors.faint

  return (
    <View className={`items-center gap-2 rounded-xl border border-foose-border bg-foose-surface px-5 py-8 ${className}`}>
      <Ionicons color={iconColor} name={icons[tone]} size={28} />
      <Text className="text-center text-base font-bold text-foose-text">{title}</Text>
      {!!body && <Text className="text-center text-sm text-foose-muted">{body}</Text>}
      {!!action && <View className="mt-2">{action}</View>}
    </View>
  )
}
