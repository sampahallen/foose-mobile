import { Ionicons } from '@expo/vector-icons'
import { router, type Href } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { useThemeColors } from '../../hooks/useThemeColors'

export function SectionHeader({
  actionHref,
  actionLabel = 'View more',
  eyebrow,
  title,
}: {
  actionHref?: Href
  actionLabel?: string
  eyebrow?: string
  title: string
}) {
  const colors = useThemeColors()

  return (
    <View className="mb-3 flex-row items-end justify-between gap-3">
      <View className="min-w-0 flex-1">
        <Text className="text-lg font-bold text-foose-text">{title}</Text>
        {!!eyebrow && <Text className="text-xs text-foose-muted">{eyebrow}</Text>}
      </View>
      {!!actionHref && (
        <Pressable
          accessibilityRole="button"
          className="flex-row items-center gap-0.5 active:opacity-70"
          onPress={() => router.push(actionHref)}
        >
          <Text className="text-xs font-black text-accent">{actionLabel}</Text>
          <Ionicons color={colors.accent} name="chevron-forward" size={13} />
        </Pressable>
      )}
    </View>
  )
}
