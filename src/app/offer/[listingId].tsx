import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ScrollView, Text, TextInput, View } from 'react-native'
import { AuthRequired } from '../../components/auth/AuthRequired'
import { InlineNotice } from '../../components/feedback/InlineNotice'
import { ListSkeleton } from '../../components/feedback/Skeleton'
import { StatePanel } from '../../components/feedback/StatePanel'
import { Screen } from '../../components/layout/Screen'
import { TopBar } from '../../components/layout/TopBar'
import { Button } from '../../components/ui/Button'
import { useCart } from '../../hooks/useCart'
import { useThemeColors } from '../../hooks/useThemeColors'
import { apiGet, apiPost } from '../../lib/api'
import type { Bargain, BargainResponse, Listing } from '../../types/api'
import { getErrorMessage } from '../../utils/errorMessage'
import { formatMoney, idValue, parseGhsToPesewas } from '../../utils/format'

function conversationHref(listing: Listing | null) {
  const shop = listing && typeof listing.shopId === 'object' ? listing.shopId : undefined
  const ownerId = idValue(shop?.ownerId)
  if (!ownerId || !listing) return '/(tabs)/inbox'
  return `/chat/new?receiverId=${encodeURIComponent(ownerId)}&listingId=${encodeURIComponent(listing._id)}`
}

/**
 * Offer composer. Mobile has no sheet or money-input primitive, so this is a
 * real screen rather than a modal bolted onto listing detail.
 */
export default function MakeOfferScreen() {
  const { listingId } = useLocalSearchParams<{ listingId: string }>()
  const cart = useCart()
  const colors = useThemeColors()
  const [listing, setListing] = useState<Listing | null>(null)
  const [existing, setExisting] = useState<Bargain | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const load = useCallback(async () => {
    if (!listingId) return
    setLoading(true)
    try {
      const [listingData, bargainData] = await Promise.all([
        apiGet<{ listing: Listing }>(`/listings/${encodeURIComponent(listingId)}`),
        apiGet<{ bargain: Bargain | null }>(`/bargains/listing/${encodeURIComponent(listingId)}/mine`).catch(() => ({
          bargain: null,
        })),
      ])
      setListing(listingData.listing)
      setExisting(bargainData.bargain)
    } catch (requestError) {
      setLoadError(getErrorMessage(requestError, 'Unable to load this listing'))
    } finally {
      setLoading(false)
    }
  }, [listingId])

  useEffect(() => {
    // Deferred so the effect never sets state synchronously and cascades a second render pass.
    queueMicrotask(() => void load())
  }, [load])

  async function submit() {
    if (!listing) return
    const amount = parseGhsToPesewas(value)
    if (amount === null || amount <= 0) {
      setError('Enter an amount like 70 or 70.50')
      return
    }
    if (amount >= listing.price) {
      setError(`Offer below the listed ${formatMoney(listing.price, listing.currency)}`)
      return
    }

    setSending(true)
    setError('')
    setWarning('')
    try {
      const result = await apiPost<BargainResponse>('/bargains', { amount, listingId: listing._id })
      setExisting(result.bargain)
      setSent(true)
      // Sending an offer is a buying intent, so the item goes straight into the
      // cart at the listed price. If the seller accepts, checkout picks up the
      // agreed price automatically.
      if (!cart.items.some((item) => item.listingId === listing._id)) cart.addListing(listing)
      if (result.belowSellerMinimum) {
        setWarning('That is below what this seller usually accepts, so they may turn it down. You can offer more if they do.')
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Offer could not be sent'))
    } finally {
      setSending(false)
    }
  }

  const canBargain = Boolean(listing?.bargainingAllowed) && listing?.status === 'active'

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar showBack showCart={false} showSearch={false} title="Make an offer" />
      <AuthRequired body="Sign in to bargain with sellers.">
        <ScrollView contentContainerClassName="gap-4 p-4">
          {loading && <ListSkeleton />}
          {!loading && loadError && <StatePanel body={loadError} title="Listing unavailable" tone="error" />}

          {!loading && !loadError && listing && (
            <>
              <View className="gap-1 rounded-xl border border-foose-border bg-foose-surface p-4">
                <Text className="text-sm font-bold text-foose-text">{listing.title}</Text>
                <Text className="text-xl font-black text-accent">{formatMoney(listing.price, listing.currency)}</Text>
                <Text className="text-xs text-foose-muted">Listed price</Text>
              </View>

              {!canBargain && (
                <InlineNotice title="Not open to offers" tone="info">
                  This seller has set a fixed price for this item.
                </InlineNotice>
              )}

              {canBargain && existing && (
                <>
                  <InlineNotice
                    action={
                      <Button
                        label="Open conversation"
                        onPress={() => router.push(conversationHref(listing))}
                        size="sm"
                        variant="ghost"
                      />
                    }
                    title={
                      existing.status === 'accepted'
                        ? `Your price: ${formatMoney(existing.agreedPrice || 0, listing.currency)}`
                        : sent
                          ? 'Offer sent'
                          : 'Bargain already running'
                    }
                    tone={existing.status === 'accepted' ? 'success' : 'info'}
                  >
                    {existing.status === 'accepted'
                      ? 'This price is yours until you check out. Other buyers can still buy at the listed price.'
                      : 'It is in your cart while you wait. Carry on in your inbox — accepting, countering, and dropping all happen there.'}
                  </InlineNotice>
                  {!!warning && <InlineNotice title="Heads up" tone="warning">{warning}</InlineNotice>}
                </>
              )}

              {canBargain && !existing && (
                <View className="gap-2">
                  <Text className="text-xs text-foose-muted">
                    Offer what you think it is worth. The seller can accept, counter, or decline, and you carry on in
                    your inbox. Sending an offer also adds this item to your cart.
                  </Text>
                  <Text className="text-xs font-bold text-foose-text">Your price ({listing.currency || 'GHS'})</Text>
                  <TextInput
                    autoFocus
                    className="h-12 rounded-xl border border-foose-border bg-foose-surface-low px-3.5 text-sm text-foose-text"
                    keyboardType="decimal-pad"
                    onChangeText={(next) => {
                      setValue(next)
                      if (error) setError('')
                    }}
                    placeholder="70.00"
                    placeholderTextColor={colors.faint}
                    value={value}
                  />
                  {!!error && <Text className="text-xs font-semibold text-foose-danger">{error}</Text>}
                  <Button full label="Send offer" loading={sending} onPress={() => void submit()} />
                </View>
              )}
            </>
          )}
        </ScrollView>
      </AuthRequired>
    </Screen>
  )
}
