import { router } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { InlineNotice } from '../../components/feedback/InlineNotice'
import { ProductGridSkeleton } from '../../components/feedback/Skeleton'
import { StatePanel } from '../../components/feedback/StatePanel'
import { Screen } from '../../components/layout/Screen'
import { TopBar } from '../../components/layout/TopBar'
import { ProductGrid } from '../../components/marketplace/ProductGrid'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { SectionHeader } from '../../components/ui/SectionHeader'
import { useApiResource } from '../../hooks/useApiResource'
import { useAuth } from '../../hooks/useAuth'
import { useThemeColors } from '../../hooks/useThemeColors'
import type { PaginatedListings, PopularSearch, WeeklyTopSeller } from '../../types/api'
import { withoutOwnListings } from '../../utils/listingOwnership'

export default function HomeScreen() {
  const { user } = useAuth()
  const colors = useThemeColors()
  const freshDrops = useApiResource<PaginatedListings>('/search/items?page=1&limit=12&sort=newest')
  const topPicks = useApiResource<PaginatedListings>('/search/top-picks?page=1&limit=12&sort=newest')
  const suggested = useApiResource<PaginatedListings>(
    user ? '/recommendations/suggested?page=1&limit=12&type=retail' : null,
    Boolean(user),
  )
  const freshBales = useApiResource<PaginatedListings>('/search/items?page=1&limit=6&sort=newest&type=wholesale')
  const popularSearches = useApiResource<{ searches: PopularSearch[] }>('/search/popular-searches?limit=5')
  const topSellers = useApiResource<{ sellers: WeeklyTopSeller[] }>('/search/top-sellers?limit=5')

  const topPickItems = useMemo(() => withoutOwnListings(topPicks.data?.results || [], user), [topPicks.data?.results, user])
  const freshDropItems = useMemo(() => withoutOwnListings(freshDrops.data?.results || [], user), [freshDrops.data?.results, user])
  const suggestedItems = useMemo(() => withoutOwnListings(suggested.data?.results || [], user), [suggested.data?.results, user])
  const freshBaleItems = useMemo(() => withoutOwnListings(freshBales.data?.results || [], user), [freshBales.data?.results, user])

  const refreshing = freshDrops.refreshing || topPicks.refreshing || suggested.refreshing

  function refreshAll() {
    void freshDrops.refetch()
    void topPicks.refetch()
    void suggested.refetch()
    void freshBales.refetch()
    void popularSearches.refetch()
    void topSellers.refetch()
  }

  return (
    <Screen>
      <TopBar showProfile title="Foose" />
      <ScrollView
        contentContainerClassName="gap-6 p-4 pb-10"
        refreshControl={<RefreshControl onRefresh={refreshAll} refreshing={refreshing} tintColor={colors.accent} />}
      >
        <View className="gap-3 rounded-2xl bg-accent p-5">
          <Text className="text-xs font-semibold uppercase tracking-widest text-white/75">
            {user ? 'Welcome back' : 'Welcome to Foose'}
          </Text>
          <Text className="text-2xl font-bold text-white">
            {user ? `Hey, ${user.name || user.username}` : 'Thrift smarter.'}
          </Text>
          <Text className="text-sm text-white/85">
            Ghana&apos;s digital hub for curated second-hand street style. Authenticity verified, speed guaranteed.
          </Text>
          <Pressable
            accessibilityLabel="Search the marketplace"
            accessibilityRole="search"
            className="mt-1 min-h-12 justify-center rounded-xl bg-foose-surface px-4"
            onPress={() => router.push('/search')}
          >
            <Text className="text-sm text-foose-muted">Search curated finds…</Text>
          </Pressable>
        </View>

        {(topPicks.loading || topPicks.error || topPickItems.length > 0) && (
          <View>
            <SectionHeader
              actionHref="/browse"
              eyebrow="Paid placements for standout finds."
              title="Top picks"
            />
            {topPicks.initialLoading && <ProductGridSkeleton count={4} />}
            {!!topPicks.error && !topPickItems.length && (
              <InlineNotice title="Top Picks did not load" tone="error">
                Continue browsing the other Home sections.
              </InlineNotice>
            )}
            {!!topPickItems.length && <ProductGrid listings={topPickItems.slice(0, 6)} />}
          </View>
        )}

        <View>
          <SectionHeader actionHref="/browse" eyebrow="Latest active listings from verified sellers." title="Fresh drops" />
          {freshDrops.initialLoading && <ProductGridSkeleton count={4} />}
          {!!freshDrops.error && !freshDropItems.length && (
            <InlineNotice
              action={<Button label="Retry" onPress={() => void freshDrops.refetch()} size="sm" variant="ghost" />}
              title="Fresh drops did not load"
              tone="error"
            >
              The other Home collections are still available.
            </InlineNotice>
          )}
          {!freshDrops.loading && !freshDrops.error && !freshDropItems.length && (
            <StatePanel body="Listings will appear here as sellers publish them." title="No listings yet" tone="empty" />
          )}
          {!!freshDropItems.length && <ProductGrid listings={freshDropItems.slice(0, 8)} />}
        </View>

        <View>
          <SectionHeader
            actionHref={user ? '/browse' : undefined}
            eyebrow="Personalized from the styles, shops, and details you enjoy."
            title="Suggested for you"
          />
          {!user && (
            <StatePanel
              action={<Button label="Sign in" onPress={() => router.push('/login')} />}
              body="Sign in to build recommendations from the pieces and creators you interact with."
              title="Make this feed yours"
              tone="info"
            />
          )}
          {user && suggested.initialLoading && <ProductGridSkeleton count={4} />}
          {user && !suggested.loading && !suggested.error && !suggestedItems.length && (
            <StatePanel
              body="Browse, save, and shop a few pieces so Foose can learn what fits your style."
              title="Your suggestions are warming up"
              tone="info"
            />
          )}
          {!!suggestedItems.length && <ProductGrid listings={suggestedItems.slice(0, 6)} />}
        </View>

        {freshBaleItems.length > 0 && (
          <View>
            <SectionHeader
              actionHref="/browse?type=wholesale"
              eyebrow="Newest wholesale listings for bulk buyers and shop owners."
              title="Fresh bales"
            />
            <ProductGrid listings={freshBaleItems.slice(0, 4)} />
          </View>
        )}

        {!user?.hasShop && (
          <View className="gap-3 rounded-2xl bg-accent p-5">
            <Text className="text-xl font-bold text-white">Turn your closet into a business.</Text>
            <Text className="text-sm text-white/85">
              Create a verified DigiShop, publish listings, and manage orders from your profile.
            </Text>
          </View>
        )}

        <View className="gap-3">
          <SectionHeader title="This week&apos;s pulse" />
          <View className="gap-2 rounded-xl border border-foose-border bg-foose-surface p-4">
            <Text className="text-sm font-bold text-foose-text">Top sellers this week</Text>
            {!topSellers.data?.sellers.length && (
              <Text className="text-xs text-foose-muted">
                Weekly seller activity appears after completed marketplace orders are recorded.
              </Text>
            )}
            {topSellers.data?.sellers.slice(0, 5).map((seller, index) => (
              <Pressable
                accessibilityRole="button"
                className="flex-row items-center gap-3 rounded-lg border border-foose-border bg-foose-surface-low p-2.5 active:opacity-80"
                key={seller._id}
                onPress={() => router.push(`/shop/${seller.slug}`)}
              >
                <View className="size-7 items-center justify-center rounded-full bg-accent">
                  <Text className="text-xs font-bold text-white">{index + 1}</Text>
                </View>
                <Avatar name={seller.shopName} size={32} uri={seller.logoUrl} />
                <Text className="min-w-0 flex-1 text-sm font-black text-foose-text" numberOfLines={1}>
                  {seller.shopName}
                </Text>
              </Pressable>
            ))}
          </View>

          <View className="gap-2 rounded-xl border border-foose-border bg-foose-surface p-4">
            <Text className="text-sm font-bold text-foose-text">Popular searches</Text>
            {!popularSearches.data?.searches.length && (
              <Text className="text-xs text-foose-muted">Popular searches appear as shoppers discover items.</Text>
            )}
            {popularSearches.data?.searches.slice(0, 5).map((search) => (
              <Pressable
                accessibilityRole="button"
                className="rounded-lg border border-foose-border bg-foose-surface-low p-2.5 active:opacity-80"
                key={search.normalizedQuery}
                onPress={() => router.push(`/browse?q=${encodeURIComponent(search.query)}`)}
              >
                <Text className="text-sm text-foose-text">{search.query}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  )
}
