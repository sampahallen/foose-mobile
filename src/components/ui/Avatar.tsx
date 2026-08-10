import { Image } from 'expo-image'
import { Text, View } from 'react-native'
import { initials } from '../../utils/format'

export function Avatar({
  className = '',
  name,
  size = 40,
  uri,
}: {
  className?: string
  name?: string
  size?: number
  uri?: string | null
}) {
  if (uri) {
    return (
      <Image
        accessibilityIgnoresInvertColors
        className={`rounded-full bg-foose-surface-mid ${className}`}
        contentFit="cover"
        source={{ uri }}
        style={{ height: size, width: size }}
      />
    )
  }

  return (
    <View
      className={`items-center justify-center rounded-full bg-accent-light ${className}`}
      style={{ height: size, width: size }}
    >
      <Text className="font-bold text-accent" style={{ fontSize: Math.max(10, size * 0.36) }}>
        {initials(name)}
      </Text>
    </View>
  )
}
