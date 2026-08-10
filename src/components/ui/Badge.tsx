import { Text, View } from 'react-native'

type Tone = 'accent' | 'neutral' | 'danger' | 'success' | 'warning'

const tones: Record<Tone, { container: string; label: string }> = {
  accent: { container: 'bg-accent-light', label: 'text-accent' },
  neutral: { container: 'bg-foose-surface-mid', label: 'text-foose-muted' },
  danger: { container: 'bg-foose-danger-bg', label: 'text-foose-danger' },
  success: { container: 'bg-foose-success-bg', label: 'text-foose-success' },
  warning: { container: 'bg-foose-warning-bg', label: 'text-foose-warning' },
}

export function Badge({ className = '', label, tone = 'accent' }: { className?: string; label: string; tone?: Tone }) {
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${tones[tone].container} ${className}`}>
      <Text className={`text-[10px] font-black uppercase tracking-wide ${tones[tone].label}`}>{label}</Text>
    </View>
  )
}
