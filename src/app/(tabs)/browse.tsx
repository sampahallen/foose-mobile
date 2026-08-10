import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native'
import { ProductGridSkeleton } from '../../components/feedback/Skeleton'
import { StatePanel } from '../../components/feedback/StatePanel'
import { Screen } from '../../components/layout/Screen'
import { TopBar } from '../../components/layout/TopBar'
import { ProductCard } from '../../components/marketplace/ProductCard'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { useAuth } from '../../hooks/useAuth'
import { useInfiniteApiResource } from '../../hooks/useInfiniteApiResource'
import { useThemeColors } from '../../hooks/useThemeColors'
import type { Listing, PaginatedListings } from '../../types/api'
import { withoutOwnListings } from '../../utils/listingOwnership'

const SORTS = [
  { label: 'Relevance', value: 'relevance' },
  { label: 'Newest', value: 'newest' },
  { label: 'Price ↑', value: 'price_asc' },
  { label: 'Price ↓', value: 'price_desc' },
] as const

function createFeedSeed() {
  return `${Date.now()}${Math.random().toString(36).slice(2, 8)}`
}

export default function BrowseScreen() {
  const { user } = useAuth()
  const colors = useThemeColors()
  const params = useLocalSearchParams<{ category?: string; q?: string; type?: string }>()
  const query = typeof params.q === 'string' ? params.q : ''
  const [mode, setMode] = useState<'retail' | 'wholesale'>(params.type === 'wholesale' ? 'wholesale' : 'retail')
  const [sort, setSort] = useState<string>('relevance')
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
      if (typeof params.category === 'string' && params.category) search.set('category', params.category)
      return `/recommendations/feed?${search.toString()}`
    },
    [mode, params.category, query, seed, sort],
  )

  const extract = useCallback((data: PaginatedListings) => data.results || [], [])
  const listings = useInfiniteApiResource<Listing, PaginatedListings>(buildPath, extract, [mode, sort, query, params.category])
  const feedListings = useMemo(() => withoutOwnListings(listings.items, user), [listings.items, user])
  const resultCount = listings.total > 50 ? '50+' : String(listings.total)

  return (
    <Screen>
      <TopBar showSearch={false} title="Marketplace" />
      <View className="gap-3 border-b border-foose-border bg-foose-surface px-4 pb-3">
        <Pressable
          accessibilityLabel="Search the marketplace"
          accessibilityRole="search"
          className="min-h-11 flex-row items-center gap-2 rounded-xl border border-foose-border bg-foose-surface-low px-3"
          onPress={() => router.push('/search')}
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
        <View className="flex-row gap-2">
          <Chip active={mode === 'retail'} label="Retail" onPress={() => setMode('retail')} />
          <Chip active={mode === 'wholesale'} label="Bales" onPress={() => setMode('wholesale')} />
          <View className="flex-1" />
          <View className="justify-center rounded-full bg-accent-light px-3">
            <Text className="text-xs font-black text-accent">
              {resultCount} {mode === 'wholesale' ? 'bales' : 'items'}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          {SORTS.map((option) => (
            <Chip active={sort === option.value} key={option.value} label={option.label} onPress={() => setSort(option.value)} />
          ))}
        </View>
      </View>

      <FlatList
        columnWrapperClassName="justify-between"
        contentContainerClassName="gap-y-4 p-4 pb-10"
        data={feedListings}
        keyExtractor={(listing) => listing._id}
        ListEmptyComponent={
          listings.loading ? (
            <ProductGridSkeleton />
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
                  ? `No ${mode === 'wholesale' ? 'bales' : 'items'} match “${query}”. Try a shorter search.`
                  : `There are no active ${mode === 'wholesale' ? 'bales' : 'items'} for these filters yet.`
              }
              title="No marketplace matches"
              tone="empty"
            />
          )
        }
        ListFooterComponent={
          listings.loadingMore ? (
            <View className="py-6">
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : listings.loadMoreError ? (
            <View className="py-4">
              <Button label="Load more" onPress={listings.loadMore} variant="secondary" />
            </View>
          ) : null
        }
        numColumns={2}
        onEndReached={listings.loadMore}
        onEndReachedThreshold={0.6}
        refreshControl={
          <RefreshControl onRefresh={() => void listings.refetch()} refreshing={listings.refreshing} tintColor={colors.accent} />
        }
        renderItem={({ item }) => <ProductCard className="w-[48%]" listing={item} />}
      />
    </Screen>
  )
}
