import { MaterialIcons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native'
import { ProductGridSkeleton } from '../../components/feedback/Skeleton'
import { StatePanel } from '../../components/feedback/StatePanel'
import { Screen } from '../../components/layout/Screen'
import { TopBar } from '../../components/layout/TopBar'
import { ProductGrid } from '../../components/marketplace/ProductGrid'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useApiResource } from '../../hooks/useApiResource'
import { useThemeColors } from '../../hooks/useThemeColors'
import type { Listing, Shop } from '../../types/api'

export default function ShopScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const colors = useThemeColors()
  const shopResource = useApiResource<{ shop: Shop }>(slug ? `/digishops/${slug}` : null)
  const shop = shopResource.data?.shop
  const listings = useApiResource<{ listings: Listing[] }>(shop?._id ? `/listings/shop/${shop._id}` : null, Boolean(shop?._id))

  if (shopResource.initialLoading) {
    return (
      <Screen edges={['top', 'bottom']}>
        <TopBar showBack title="Shop" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    )
  }

  if (!shop) {
    return (
      <Screen edges={['top', 'bottom']}>
        <TopBar showBack title="Shop" />
        <View className="p-4">
          <StatePanel
            action={<Button label="Browse the marketplace" onPress={() => router.replace('/browse')} />}
            body={shopResource.error || 'This DigiShop may have been closed.'}
            title="Shop unavailable"
            tone={shopResource.error ? 'error' : 'empty'}
          />
        </View>
      </Screen>
    )
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar showBack title={shop.shopName} />
      <ScrollView
        contentContainerClassName="pb-10"
        refreshControl={
          <RefreshControl
            onRefresh={() => {
              void shopResource.refetch()
              void listings.refetch()
            }}
            refreshing={shopResource.refreshing || listings.refreshing}
            tintColor={colors.accent}
          />
        }
      >
        {!!shop.bannerUrl && (
          <Image accessibilityIgnoresInvertColors contentFit="cover" source={{ uri: shop.bannerUrl }} style={{ height: 140, width: '100%' }} />
        )}

        <View className="gap-3 p-4">
          <View className="flex-row items-center gap-3">
            <Avatar name={shop.shopName} size={56} uri={shop.logoUrl} />
            <View className="min-w-0 flex-1 gap-0.5">
              <View className="flex-row items-center gap-1">
                <Text className="min-w-0 flex-1 text-lg font-bold text-foose-text" numberOfLines={1}>
                  {shop.shopName}
                </Text>
                <MaterialIcons color={colors.accent} name="verified" size={16} />
              </View>
              {!!shop.location?.city && (
                <Text className="text-xs text-foose-muted">
                  {shop.location.city}
                  {shop.location.region ? `, ${shop.location.region}` : ''}
                </Text>
              )}
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {!!shop.category && <Badge label={shop.category} />}
            {shop.isLive === false && <Badge label="Paused" tone="neutral" />}
            {typeof shop.rating === 'number' && shop.rating > 0 && (
              <Badge label={`${shop.rating.toFixed(1)} ★ (${shop.totalReviews || 0})`} tone="success" />
            )}
          </View>

          {!!shop.bio && <Text className="text-sm leading-5 text-foose-text">{shop.bio}</Text>}

          <Text className="mt-2 text-base font-bold text-foose-text">
            Listings{listings.data ? ` (${listings.data.listings.length})` : ''}
          </Text>

          {listings.initialLoading && <ProductGridSkeleton count={4} />}
          {!listings.loading && !listings.data?.listings.length && (
            <StatePanel body="This shop has not published any active listings yet." title="No listings" tone="empty" />
          )}
          {!!listings.data?.listings.length && <ProductGrid listings={listings.data.listings} />}
        </View>
      </ScrollView>
    </Screen>
  )
}
