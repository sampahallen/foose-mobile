import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { FlatList, Pressable, RefreshControl, Text, View, type ViewToken } from 'react-native'
import { InlineNotice } from '../../components/feedback/InlineNotice'
import { ProductGridSkeleton, SkeletonBlock } from '../../components/feedback/Skeleton'
import { StatePanel } from '../../components/feedback/StatePanel'
import { Screen } from '../../components/layout/Screen'
import { TopBar } from '../../components/layout/TopBar'
import { EMPTY_BROWSE_FILTERS, MarketplaceFilterSheet, activeFilterCount, type BrowseFilters } from '../../components/marketplace/MarketplaceFilterSheet'
import { ProductCard } from '../../components/marketplace/ProductCard'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { useAuth } from '../../hooks/useAuth'
import { useInfiniteApiResource } from '../../hooks/useInfiniteApiResource'
import { useThemeColors } from '../../hooks/useThemeColors'
import type { Listing, PaginatedListings } from '../../types/api'
import { withoutOwnListings } from '../../utils/listingOwnership'
import { isActiveTopPick, recordPromotionMetric } from '../../utils/promotions'

const SORTS = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Newest', value: 'newest' },
  { label: 'Price ↑', value: 'price_asc' },
  { label: 'Price ↓', value: 'price_desc' },
] as const

function createFeedSeed() {
  return `${Date.now()}${Math.random().toString(36).slice(2, 8)}`
}

// RN's native equivalent of the web card's per-card IntersectionObserver: an item only appears here
// once it's been ≥50% visible for a continuous second, matching the same impression rule. Defined at
// module scope (not useRef) since neither depends on component state — the React Compiler's
// react-hooks/refs rule forbids reading `.current` during render, so a ref wrapper isn't the fix here.
const viewabilityConfig = { itemVisiblePercentThreshold: 50, minimumViewTime: 1000 }

function onViewableItemsChanged({ viewableItems }: { viewableItems: ViewToken[] }) {
  for (const { isViewable, item } of viewableItems) {
    const listing = item as Listing
    if (isViewable && isActiveTopPick(listing.promotionTags, listing.promotionExpiresAt)) {
      recordPromotionMetric(listing._id, 'impression')
    }
  }
}

export default function BrowseScreen() {
  const { user } = useAuth()
  const colors = useThemeColors()
  const params = useLocalSearchParams<{ category?: string; q?: string; type?: string }>()
  const query = typeof params.q === 'string' ? params.q : ''
  const [mode, setMode] = useState<'retail' | 'wholesale'>(params.type === 'wholesale' ? 'wholesale' : 'retail')
  const [sort, setSort] = useState<string>('relevance')
  const [filters, setFilters] = useState<BrowseFilters>(() => ({
    ...EMPTY_BROWSE_FILTERS,
    category: typeof params.category === 'string' ? params.category : '',
  }))
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  // The feed is shuffled per session; a stable seed keeps page 2 consistent with page 1.
  // Lazy `useState` initializer: the seed must be generated once, not on every render.
  const [seed] = useState(createFeedSeed)

  const buildPath = useCallback(
    (page: number) => {
      const search = new URLSearchParams()
      search.set('page', String(page))
      search.set('limit', '30')
      search.set('type', mode)
      search.set('sort', sort)
      search.set('seed', seed)
      if (query) search.set('q', query)
      const filterEntries = Object.entries(filters) as [keyof BrowseFilters, string][]
      for (const [key, fieldValue] of filterEntries) {
        if (fieldValue) search.set(key, fieldValue)
      }
      return `/recommendations/feed?${search.toString()}`
    },
    [filters, mode, query, seed, sort],
  )

  const extract = useCallback((data: PaginatedListings) => data.results || [], [])
  const listings = useInfiniteApiResource<Listing, PaginatedListings>(buildPath, extract, [mode, sort, query, filters])
  const feedListings = useMemo(() => withoutOwnListings(listings.items, user), [listings.items, user])
  const resultCount = listings.total > 50 ? '50+' : String(listings.total)
  const filterCount = activeFilterCount(filters)
  const itemNoun = mode === 'wholesale' ? 'bales' : 'items'
  // Forwarded as route params so /search's suggestions call can scope results to what's already
  // filtered here, mirroring web's `SUGGESTION_FILTERS` forwarding in `BrowseSearchCombobox.tsx`.
  const searchParams = useMemo(() => {
    const params: Record<string, string> = { type: mode }
    for (const [key, fieldValue] of Object.entries(filters) as [keyof BrowseFilters, string][]) {
      if (fieldValue) params[key] = fieldValue
    }
    return params
  }, [filters, mode])

  return (
    <Screen>
      <TopBar showSearch={false} title="Marketplace" />
      <View className="gap-3 border-b border-foose-border bg-foose-surface px-4 pb-3">
        <Pressable
          accessibilityLabel="Search the marketplace"
          accessibilityRole="search"
          className="min-h-11 flex-row items-center gap-2 rounded-xl border border-foose-border bg-foose-surface-low px-3"
          onPress={() => router.push({ params: searchParams, pathname: '/search' })}
        >
          <Ionicons color={colors.accent} name="search" size={18} />
          <Text className="min-w-0 flex-1 text-sm text-foose-muted" numberOfLines={1}>
            {query || 'Search marketplace items…'}
          </Text>
          {!!query && (
            <Pressable accessibilityLabel="Clear search" accessibilityRole="button" hitSlop={8} onPress={() => router.setParams({ q: '' })}>
              <Ionicons color={colors.faint} name="close-circle" size={18} />
            </Pressable>
          )}
        </Pressable>

        <View className="flex-row border-b border-foose-border">
          {(['retail', 'wholesale'] as const).map((option) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === option }}
              className={`flex-1 items-center border-b-2 py-2.5 ${mode === option ? 'border-accent' : 'border-transparent'}`}
              key={option}
              onPress={() => setMode(option)}
            >
              <Text className={`text-sm font-bold ${mode === option ? 'text-accent' : 'text-foose-muted'}`}>
                {option === 'retail' ? 'Retail' : 'Bales'}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable
            accessibilityLabel="Open filters"
            accessibilityRole="button"
            className="flex-row items-center gap-1.5 rounded-full bg-accent px-3.5 py-2"
            onPress={() => setFilterSheetOpen(true)}
          >
            <Ionicons color="#ffffff" name="funnel-outline" size={14} />
            <Text className="text-xs font-black text-white">Filters{filterCount > 0 ? ` (${filterCount})` : ''}</Text>
          </Pressable>
          <View className="flex-1" />
          <View className="justify-center rounded-full bg-accent-light px-3 py-1.5">
            <Text className="text-xs font-black text-accent">
              {resultCount} {itemNoun}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          {SORTS.map((option) => (
            <Chip active={sort === option.value} key={option.value} label={option.label} onPress={() => setSort(option.value)} />
          ))}
        </View>

        {!!listings.error && !!feedListings.length && (
          <InlineNotice
            action={
              <Pressable accessibilityRole="button" onPress={() => void listings.refetch()}>
                <Text className="text-sm font-black text-accent">Retry</Text>
              </Pressable>
            }
            tone="warning"
          >
            The latest marketplace update failed. Your current results are still here.
          </InlineNotice>
        )}
      </View>

      <FlatList
        columnWrapperClassName="gap-x-3"
        contentContainerClassName="gap-y-5 p-4 pb-10"
        data={feedListings}
        keyExtractor={(listing) => listing._id}
        ListEmptyComponent={
          listings.loading ? (
            <ProductGridSkeleton count={12} label={query ? 'Searching marketplace' : 'Loading marketplace'} />
          ) : listings.error ? (
            <StatePanel
              action={<Button label="Try again" onPress={() => void listings.refetch()} variant="secondary" />}
              body={listings.error}
              title="Marketplace could not load"
              tone="error"
            />
          ) : (
            <StatePanel
              body={
                query
                  ? `No ${itemNoun} match “${query}”. Try a shorter search or clear a filter.`
                  : `There are no active ${itemNoun} for these filters yet.`
              }
              title="No marketplace matches"
              tone="empty"
            />
          )
        }
        ListFooterComponent={
          listings.loadMoreError ? (
            <InlineNotice
              action={
                <Pressable accessibilityRole="button" onPress={listings.loadMore}>
                  <Text className="text-sm font-black text-accent">Try again</Text>
                </Pressable>
              }
              className="mt-1"
              title="More results did not load"
              tone="error"
            >
              {listings.loadMoreError}
            </InlineNotice>
          ) : listings.loadingMore ? (
            <View className="flex-row gap-x-3 pt-1">
              <SkeletonBlock className="aspect-[4/5] flex-1" />
              <SkeletonBlock className="aspect-[4/5] flex-1" />
            </View>
          ) : null
        }
        numColumns={2}
        onEndReached={listings.loadMore}
        onEndReachedThreshold={0.6}
        onViewableItemsChanged={onViewableItemsChanged}
        refreshControl={
          <RefreshControl onRefresh={() => void listings.refetch()} refreshing={listings.refreshing} tintColor={colors.accent} />
        }
        renderItem={({ item }) => <ProductCard className="flex-1" listing={item} />}
        viewabilityConfig={viewabilityConfig}
      />

      <MarketplaceFilterSheet
        onApply={setFilters}
        onClose={() => setFilterSheetOpen(false)}
        type={mode}
        value={filters}
        visible={filterSheetOpen}
      />
    </Screen>
  )
}
