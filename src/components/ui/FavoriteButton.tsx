import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Pressable } from 'react-native'
import { PALETTE } from '../../constants/palette'
import { useAuth } from '../../hooks/useAuth'
import { useFavorite } from '../../hooks/useFavorite'

export function FavoriteButton({
  className = '',
  initialActive,
  size = 28,
  targetId,
  targetType = 'listing',
}: {
  className?: string
  initialActive?: boolean
  size?: number
  targetId: string
  targetType?: 'event' | 'listing'
}) {
  const { user } = useAuth()
  const favorite = useFavorite(targetType, targetId, initialActive)

  return (
    <Pressable
      accessibilityLabel={favorite.active ? 'Remove from saved' : 'Save'}
      accessibilityRole="button"
      className={`items-center justify-center rounded-full ${favorite.active ? 'bg-accent' : 'bg-white/90'} ${className}`}
      hitSlop={6}
      onPress={() => {
        if (!user) {
          router.push('/login')
          return
        }
        void favorite.toggle()
      }}
      style={{ height: size, width: size }}
    >
      <Ionicons
        // Deliberately the fixed dark ink, not a themed token: this chip floats over listing photos
        // on a near-white background in both themes.
        color={favorite.active ? '#ffffff' : PALETTE.light.text}
        name={favorite.active ? 'heart' : 'heart-outline'}
        size={size * 0.6}
      />
    </Pressable>
  )
}
