import { View } from 'react-native'

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <View className={`rounded-lg bg-foose-surface-mid ${className}`} />
}

/**
 * Matches the 2-up product grid so the swap from skeleton to data does not shift layout.
 * `label` mirrors web's `ProductGridSkeleton` (`frontend/src/components/feedback/DiscoverySkeletons.tsx`)
 * screen-reader announcement — it's not rendered visibly there either, just exposed to assistive tech.
 */
export function ProductGridSkeleton({ count = 6, label = 'Loading listings' }: { count?: number; label?: string }) {
  return (
    <View accessibilityLabel={label} accessibilityLiveRegion="polite" accessibilityRole="progressbar" className="flex-row flex-wrap justify-between gap-y-5">
      {Array.from({ length: count }).map((_, index) => (
        <View className="w-[48%] gap-2" key={index}>
          <SkeletonBlock className="aspect-[4/5] w-full" />
          <SkeletonBlock className="h-3 w-2/3" />
          <SkeletonBlock className="h-3 w-1/3" />
          <SkeletonBlock className="h-3 w-1/2" />
        </View>
      ))}
    </View>
  )
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <View className="gap-3">
      {Array.from({ length: rows }).map((_, index) => (
        <View className="flex-row items-center gap-3 rounded-xl border border-foose-border bg-foose-surface p-3" key={index}>
          <SkeletonBlock className="size-11 rounded-full" />
          <View className="flex-1 gap-2">
            <SkeletonBlock className="h-3 w-1/2" />
            <SkeletonBlock className="h-3 w-3/4" />
          </View>
        </View>
      ))}
    </View>
  )
}
