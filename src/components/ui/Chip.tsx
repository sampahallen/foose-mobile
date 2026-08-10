import { Pressable, Text } from 'react-native'

export function Chip({
  active = false,
  className = '',
  label,
  onPress,
}: {
  active?: boolean
  className?: string
  label: string
  onPress?: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`rounded-full border px-3.5 py-2 active:opacity-80 ${
        active ? 'border-accent bg-accent' : 'border-foose-border bg-foose-surface'
      } ${className}`}
      onPress={onPress}
    >
      <Text className={`text-xs font-bold ${active ? 'text-white' : 'text-foose-muted'}`}>{label}</Text>
    </Pressable>
  )
}
