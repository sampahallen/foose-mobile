import type { ReactNode } from 'react'
import { Text, View } from 'react-native'

type Tone = 'error' | 'info' | 'success' | 'warning'

const tones: Record<Tone, { container: string; title: string }> = {
  error: { container: 'border-foose-danger bg-foose-danger-bg', title: 'text-foose-danger' },
  info: { container: 'border-foose-border bg-foose-surface-low', title: 'text-foose-text' },
  success: { container: 'border-foose-success bg-foose-success-bg', title: 'text-foose-success' },
  warning: { container: 'border-foose-warning bg-foose-warning-bg', title: 'text-foose-warning' },
}

export function InlineNotice({
  action,
  children,
  className = '',
  title,
  tone = 'info',
}: {
  action?: ReactNode
  children?: ReactNode
  className?: string
  title?: string
  tone?: Tone
}) {
  return (
    <View className={`gap-1.5 rounded-xl border px-3.5 py-3 ${tones[tone].container} ${className}`}>
      {!!title && <Text className={`text-sm font-bold ${tones[tone].title}`}>{title}</Text>}
      {!!children && <Text className="text-xs text-foose-muted">{children}</Text>}

      {!!action && <View className="mt-1 flex-row">{action}</View>}
    </View>
  )
}
