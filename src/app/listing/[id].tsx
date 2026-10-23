import { MaterialIcons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { InlineNotice } from '../../components/feedback/InlineNotice'
import { StatePanel } from '../../components/feedback/StatePanel'
import { Screen } from '../../components/layout/Screen'
import { TopBar } from '../../components/layout/TopBar'
import { ListingImageSlider } from '../../components/marketplace/ListingImageSlider'
import { ProductGrid } from '../../components/marketplace/ProductGrid'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { FavoriteButton } from '../../components/ui/FavoriteButton'
import { SectionHeader } from '../../components/ui/SectionHeader'
import { useToast } from '../../components/feedback/ToastProvider'
import { useApiResource } from '../../hooks/useApiResource'
import { useAuth } from '../../hooks/useAuth'
import { useAcceptedBargainPrices } from '../../hooks/useBargain'
import { useCart } from '../../hooks/useCart'
import { useThemeColors } from '../../hooks/useThemeColors'
import type { Listing } from '../../types/api'
import { formatMoney, getShop, listingMeta } from '../../utils/format'
import { isOwnListing } from '../../utils/listingOwnership'
import { LISTING_COLORS } from '../../utils/listingTaxonomy'

export default function ListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const cart = useCart()
  const colors = useThemeColors()
  const { showToast } = useToast()
  const listingResource = useApiResource<{ listing: Listing }>(id ? `/listings/${id}` : null)
  const listing = listingResource.data?.listing
  const shop = listing ? getShop(listing) : undefined
  const related = useApiResource<{ listings: Listing[] }>(
    shop?._id ? `/listings/shop/${shop._id}` : null,
    Boolean(shop?._id),
  )
  const [quantity, setQuantity] = useState(1)
  // Only the caller's own bargains come back, so this can never reveal another
  // buyer's negotiated price.
  const bargainPrices = useAcceptedBargainPrices(Boolean(user && listing?.bargainingAllowed))
  const agreedPrice = listing ? bargainPrices[listing._id] : undefined
  const inCart = Boolean(listing && cart.items.some((item) => item.listingId === listing._id))

  if (listingResource.initialLoading) {
    return (
      <Screen edges={['top', 'bottom']}>
        <TopBar showBack title="Listing" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    )
  }

  if (!listing) {
    return (
      <Screen edges={['top', 'bottom']}>
        <TopBar showBack title="Listing" />
        <View className="p-4">
          <StatePanel
            action={<Button label="Back to marketplace" onPress={() => router.replace('/browse')} />}
            body={listingResource.error || 'This listing may have been sold or removed.'}
            title="Listing unavailable"
            tone={listingResource.error ? 'error' : 'empty'}
          />
        </View>
      </Screen>
    )
  }

  const isWholesale = listing.type === 'wholesale'
  const minQuantity = isWholesale ? listing.bulkMinQty || 1 : 1
  const ownListing = isOwnListing(listing, user)
  const soldOut = listing.status === 'sold' || (listing.quantity !== undefined && listing.quantity <= 0)
  const relatedListings = (related.data?.listings || []).filter((item) => item._id !== listing._id)
  const listingColorValues = listing.colors?.length ? listing.colors : listing.color ? [listing.color] : []

  // Narrowed above; captured so the callbacks below do not re-widen it to `Listing | undefined`.
  const activeListing: Listing = listing

  function addToCart() {
    const added = cart.addListing(activeListing, Math.max(quantity, minQuantity))
    showToast(added ? 'Added to cart' : 'You cannot buy your own listing', added ? 'success' : 'error')
  }

  function messageSeller() {
    const ownerId = typeof shop?.ownerId === 'string' ? shop.ownerId : shop?.ownerId?._id
    if (!user) {
      router.push('/login')
      return
    }
    if (!ownerId) {
      showToast('This seller cannot be messaged yet', 'error')
      return
    }
    router.push(`/chat/new?receiverId=${encodeURIComponent(ownerId)}&listingId=${encodeURIComponent(activeListing._id)}`)
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar showBack title={listing.title} />
      <ScrollView contentContainerClassName="pb-6">
        <View>
          <ListingImageSlider images={(listing.images || []).filter(Boolean)} title={listing.title} />
          <FavoriteButton className="absolute right-3 top-3" size={40} targetId={listing._id} />
        </View>

        <View className="gap-3 p-4">
          <View className="flex-row flex-wrap gap-2">
            <Badge label={isWholesale ? 'Wholesale bale' : 'Retail'} />
            {!!listing.condition && <Badge label={listing.condition} tone="neutral" />}
            {soldOut && <Badge label="Sold" tone="danger" />}
          </View>

          <Text className="text-xl font-bold text-foose-text">{listing.title}</Text>
          <Text className="text-2xl font-black text-accent">{formatMoney(listing.price, listing.currency)}</Text>
          <Text className="text-xs text-foose-muted">{listingMeta(listing)}</Text>

          {listingColorValues.length > 0 && (
            <View className="gap-1.5" accessibilityLabel="Listing colors">
              <Text className="text-xs font-semibold text-foose-muted">Colors</Text>
              <View className="flex-row flex-wrap gap-2">
                {listingColorValues.map((value) => {
                  const color = LISTING_COLORS.find((item) => item.value === value)
                  return (
                    <View className="flex-row items-center gap-1.5 rounded-full border border-foose-border bg-foose-surface px-2.5 py-1.5" key={value}>
                      <View className="size-3.5 rounded-full border border-foose-border" style={{ backgroundColor: value === 'multi' ? '#8a5cf6' : value === 'silver' ? '#c0c0c0' : color?.hex }} />
                      <Text className="text-xs font-bold text-foose-text">{color?.label || value}</Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )}

          {isWholesale && (
            <Text className="text-xs text-foose-muted">
              Minimum order {minQuantity} unit{minQuantity === 1 ? '' : 's'}
              {listing.bulkWeight ? ` · ${listing.bulkWeight}` : ''}
            </Text>
          )}

          {!!listing.description && <Text className="text-sm leading-5 text-foose-text">{listing.description}</Text>}

          {!!listing.location?.city && (
            <Text className="text-xs text-foose-muted">
              Ships from {listing.location.city}
              {listing.location.region ? `, ${listing.location.region}` : ''}
            </Text>
          )}

          {!!shop && (
            <Pressable
              accessibilityRole="button"
              className="mt-1 flex-row items-center gap-3 rounded-xl border border-foose-border bg-foose-surface p-3 active:opacity-80"
              onPress={() => router.push(`/shop/${shop.slug}`)}
            >
              <Avatar name={shop.shopName} size={40} uri={shop.logoUrl} />
              <View className="min-w-0 flex-1">
                <View className="flex-row items-center gap-1">
                  <Text className="min-w-0 flex-1 text-sm font-bold text-foose-text" numberOfLines={1}>
                    {shop.shopName}
                  </Text>
                  <MaterialIcons color={colors.accent} name="verified" size={14} />
                </View>
                {!!shop.location?.city && <Text className="text-xs text-foose-muted">{shop.location.city}</Text>}
              </View>
              <Text className="text-xs font-black text-accent">Visit shop</Text>
            </Pressable>
          )}

          {isWholesale && !ownListing && !soldOut && (
            <View className="flex-row items-center gap-3">
              <Text className="text-sm font-bold text-foose-text">Quantity</Text>
              <View className="flex-row items-center gap-2 rounded-xl border border-foose-border bg-foose-surface px-2">
                <Pressable
                  accessibilityLabel="Decrease quantity"
                  accessibilityRole="button"
                  className="size-9 items-center justify-center"
                  onPress={() => setQuantity((value) => Math.max(minQuantity, value - 1))}
                >
                  <Text className="text-lg font-bold text-foose-text">−</Text>
                </Pressable>
                <Text className="min-w-8 text-center text-sm font-bold text-foose-text">{Math.max(quantity, minQuantity)}</Text>
                <Pressable
                  accessibilityLabel="Increase quantity"
                  accessibilityRole="button"
                  className="size-9 items-center justify-center"
                  onPress={() => setQuantity((value) => Math.max(minQuantity, value) + 1)}
                >
                  <Text className="text-lg font-bold text-foose-text">+</Text>
                </Pressable>
              </View>
            </View>
          )}

          {ownListing && <InlineNotice title="This is your listing" tone="info">Manage it from your DigiShop on the web app.</InlineNotice>}

          {!!relatedListings.length && (
            <View className="mt-4">
              <SectionHeader title="More from this shop" />
              <ProductGrid listings={relatedListings.slice(0, 4)} />
            </View>
          )}
        </View>
      </ScrollView>

      {!ownListing && (
        <View className="gap-2 border-t border-foose-border bg-foose-surface p-3">
          {listing.bargainingAllowed && !soldOut && (
            <Button
              full
              label={agreedPrice === undefined ? 'Make an offer' : `Your price: ${formatMoney(agreedPrice, listing.currency)}`}
              onPress={() => router.push(`/offer/${encodeURIComponent(activeListing._id)}`)}
              variant="secondary"
            />
          )}
          <View className="flex-row gap-2">
            <Button className="flex-1" label="Message seller" onPress={messageSeller} variant="secondary" />
            {inCart && !soldOut ? (
              <Button
                className="flex-1"
                icon={<MaterialIcons color={colors.success} name="check" size={16} />}
                label="Added to cart"
                onPress={() => router.push('/cart')}
                variant="success"
              />
            ) : (
              <Button
                className="flex-1"
                disabled={soldOut}
                label={soldOut ? 'Sold out' : 'Add to cart'}
                onPress={addToCart}
              />
            )}
          </View>
        </View>
      )}
    </Screen>
  )
}
