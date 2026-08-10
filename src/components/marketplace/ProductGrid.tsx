import { View } from 'react-native'
import type { Listing } from '../../types/api'
import { ProductCard } from './ProductCard'

/**
 * Fixed 2-up grid, matching the web card's phone breakpoint. Rendered as a plain wrapped row rather
 * than a nested FlatList so it can sit inside a scrolling page without a virtualization warning —
 * screens that need virtualization pass `ProductCard` to their own FlatList instead.
 */
export function ProductGrid({ listings }: { listings: Listing[] }) {
  return (
    <View className="flex-row flex-wrap justify-between gap-y-4">
      {listings.map((listing) => (
        <ProductCard className="w-[48%]" key={listing._id} listing={listing} />
      ))}
      {/* Keeps a trailing odd card left-aligned instead of stretched by `justify-between`. */}
      {listings.length % 2 === 1 && <View className="w-[48%]" />}
    </View>
  )
}

/** Horizontal rail used by the Home sections that show a "view more" link. */
export function ProductRail({ listings }: { listings: Listing[] }) {
  return (
    <View className="flex-row gap-3">
      {listings.map((listing) => (
        <ProductCard className="w-36" key={listing._id} listing={listing} />
      ))}
    </View>
  )
}
