import { MaterialIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { useThemeColors } from '../../hooks/useThemeColors'
import type { Listing } from '../../types/api'
import { formatMoney, getListingImage, getShopName } from '../../utils/format'
import { isActiveTopPick, recordPromotionMetric } from '../../utils/promotions'
import { FavoriteButton } from '../ui/FavoriteButton'

/**
 * Port of the web `ProductCard` at its phone breakpoint: 4:5 image, brand / size / price / shop.
 * Width is set by the parent grid so the same card works in a 2-up grid and a horizontal rail.
 */
export function ProductCard({ className = '', listing }: { className?: string; listing: Listing }) {
  const colors = useThemeColors()
  const image = getListingImage(listing)
  const promoted = isActiveTopPick(listing.promotionTags, listing.promotionExpiresAt)
  const brand = listing.brand || 'Other'
  const size = listing.size || (listing.type === 'wholesale' ? `${listing.bulkMinQty || 1}+` : 'One size')

  return (
    <View className={className}>
      <Pressable
        accessibilityLabel={listing.title}
        accessibilityRole="button"
        className="gap-1 active:opacity-80"
        onPress={() => {
          if (promoted) recordPromotionMetric(listing._id, 'click')
          router.push(`/listing/${listing._id}`)
        }}
      >
        <View className="aspect-[4/5] w-full overflow-hidden rounded-md bg-foose-surface-mid">
          {image ? (
            <Image accessibilityIgnoresInvertColors contentFit="cover" source={{ uri: image }} style={{ flex: 1 }} transition={150} />
          ) : (
            <View className="flex-1 items-center justify-center px-3">
              <Text className="text-center text-xs font-semibold text-foose-faint">Image unavailable</Text>
            </View>
          )}
          {listing.status === 'sold' && (
            <View className="absolute left-2 top-2 rounded-full bg-foose-danger px-2 py-1">
              <Text className="text-[10px] font-black uppercase tracking-wide text-white">Sold</Text>
            </View>
          )}
          {promoted && listing.status !== 'sold' && (
            <View className="absolute left-2 top-2 rounded-full bg-accent px-2 py-1">
              <Text className="text-[10px] font-black uppercase tracking-wide text-white">Promoted</Text>
            </View>
          )}
        </View>
        <View className="gap-px py-1">
          <Text className="text-[11px] font-semibold leading-tight text-accent" numberOfLines={1}>
            {brand}
          </Text>
          <Text className="text-[11px] leading-tight text-foose-muted" numberOfLines={1}>
            {size}
          </Text>
          <Text className="text-xs font-black leading-tight text-accent">{formatMoney(listing.price, listing.currency)}</Text>
          <View className="flex-row items-center gap-1">
            <Text className="min-w-0 flex-1 text-[10px] font-bold leading-tight text-foose-muted" numberOfLines={1}>
              {getShopName(listing)}
            </Text>
            <MaterialIcons color={colors.accent} name="verified" size={11} />
          </View>
        </View>
      </Pressable>
      <FavoriteButton className="absolute right-1.5 top-1.5" targetId={listing._id} />
    </View>
  )
}
