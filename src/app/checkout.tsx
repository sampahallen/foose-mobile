import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useMemo, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { InlineNotice } from '../components/feedback/InlineNotice'
import { StatePanel } from '../components/feedback/StatePanel'
import { Screen } from '../components/layout/Screen'
import { TopBar } from '../components/layout/TopBar'
import { Button } from '../components/ui/Button'
import { Dropdown } from '../components/ui/Dropdown'
import { Input } from '../components/ui/Input'
import { useApiResource } from '../hooks/useApiResource'
import { useAuth } from '../hooks/useAuth'
import { useAcceptedBargainPrices } from '../hooks/useBargain'
import { useCart } from '../hooks/useCart'
import { useThemeColors } from '../hooks/useThemeColors'
import { apiPost } from '../lib/api'
import type { Order, PaystackPaymentSession } from '../types/api'
import { getErrorMessage } from '../utils/errorMessage'
import { formatMoney } from '../utils/format'

const STATION_COMPANIES = ['Intercity STC', '2M Express', 'VIP Jeoun'] as const

type DeliveryMethod = 'shop_pickup' | 'station_pickup'

type ShopDeliveryState = {
  company: string
  method: DeliveryMethod
  preferredTerminal: string
  recipientName: string
  recipientPhone: string
  region: string
  town: string
}

type DeliveryOptionsResponse = {
  shops: {
    location: { city: string; region: string }
    shopId: string
    shopName: string
  }[]
}

type PlaceOrderResponse = {
  order: Order
  orders?: Order[]
  payment?: (PaystackPaymentSession & { mode?: string }) | { mode: 'pickup'; provider: 'cash'; status: 'pending' }
}

function emptyDelivery(): ShopDeliveryState {
  return {
    company: STATION_COMPANIES[0],
    method: 'station_pickup',
    preferredTerminal: '',
    recipientName: '',
    recipientPhone: '',
    region: '',
    town: '',
  }
}

export default function CheckoutScreen() {
  const cart = useCart()
  const { user } = useAuth()
  const colors = useThemeColors()
  const [deliveryByShop, setDeliveryByShop] = useState<Record<string, ShopDeliveryState>>({})
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'cash_on_pickup'>('paystack')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Preview only — the server resolves the real price from the buyer's accepted
  // bargains when the order is placed.
  const bargainPrices = useAcceptedBargainPrices(Boolean(user) && cart.items.length > 0)
  const bargainedSubtotal = cart.items.reduce((sum, item) => {
    const agreed = bargainPrices[item.listingId]
    const unitPrice = agreed === undefined ? item.price : Math.min(agreed, item.price)
    return sum + unitPrice * item.quantity
  }, 0)

  // One order is created per seller, so delivery is collected per shop group.
  const shopGroups = useMemo(() => {
    const groups = new Map<string, { items: typeof cart.items; shopId: string; shopName: string }>()
    cart.items.forEach((item) => {
      const shopId = item.shopId || 'unknown'
      const group = groups.get(shopId) || { items: [], shopId, shopName: item.shopName }
      group.items = [...group.items, item]
      groups.set(shopId, group)
    })
    return Array.from(groups.values())
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the item list feeds the grouping
  }, [cart.items])

  const shopIdsKey = shopGroups.map((group) => group.shopId).filter((id) => id !== 'unknown').join(',')
  const options = useApiResource<DeliveryOptionsResponse>(
    shopIdsKey ? `/orders/checkout/delivery-options?shopIds=${encodeURIComponent(shopIdsKey)}` : null,
    Boolean(shopIdsKey),
  )

  function deliveryFor(shopId: string) {
    return deliveryByShop[shopId] || emptyDelivery()
  }

  function updateDelivery(shopId: string, patch: Partial<ShopDeliveryState>) {
    setDeliveryByShop((current) => ({ ...current, [shopId]: { ...deliveryFor(shopId), ...patch } }))
  }

  const allShopPickup = shopGroups.every((group) => deliveryFor(group.shopId).method === 'shop_pickup')
  // Cash is only offered when nothing needs to be shipped — same rule as the web checkout.
  const resolvedPaymentMethod = allShopPickup ? paymentMethod : 'paystack'

  const incompleteGroup = shopGroups.find((group) => {
    const state = deliveryFor(group.shopId)
    if (state.method === 'shop_pickup') return false
    return !state.recipientName.trim() || !state.recipientPhone.trim() || !state.region.trim() || !state.town.trim()
  })

  async function submit() {
    if (submitting) return
    setSubmitting(true)
    setError('')

    try {
      const deliveryPayload = Object.fromEntries(
        shopGroups.map((group) => {
          const state = deliveryFor(group.shopId)
          if (state.method === 'shop_pickup') return [group.shopId, { method: state.method }]
          return [
            group.shopId,
            {
              company: state.company,
              destination: {
                preferredTerminal: state.preferredTerminal.trim() || undefined,
                recipientName: state.recipientName.trim(),
                recipientPhone: state.recipientPhone.trim(),
                region: state.region.trim(),
                town: state.town.trim(),
              },
              method: state.method,
            },
          ]
        }),
      )

      const data = await apiPost<PlaceOrderResponse>(
        '/orders',
        {
          deliveryByShop: deliveryPayload,
          items: cart.items.map((item) => ({
            listingId: item.listingId,
            quantity: item.type === 'wholesale' ? item.quantity : 1,
          })),
          paymentMethod: resolvedPaymentMethod,
        },
        // Guards against a double tap creating two orders for the same cart.
        { headers: { 'Idempotency-Key': `${user?._id || 'guest'}-${cart.items.map((item) => item.listingId).join('-')}` } },
      )

      if (resolvedPaymentMethod === 'cash_on_pickup') {
        cart.clearCart()
        router.replace('/orders')
        return
      }

      const payment = data.payment as PaystackPaymentSession | undefined
      if (!payment?.accessCode || !payment.reference) throw new Error('Paystack did not return a payment access code')

      // Mobile has no Paystack inline SDK: open the hosted checkout, then verify the reference.
      const result = await WebBrowser.openAuthSessionAsync(
        `https://checkout.paystack.com/${payment.accessCode}`,
        'foose://checkout',
      )

      if (result.type !== 'success' && result.type !== 'dismiss') {
        setError('Payment was cancelled before it completed.')
        return
      }

      await apiPost(`/payments/${encodeURIComponent(payment.reference)}/actions/verify`)
      cart.clearCart()
      router.replace('/orders')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to place your order'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!cart.items.length) {
    return (
      <Screen edges={['top', 'bottom']}>
        <TopBar showBack showCart={false} showSearch={false} title="Checkout" />
        <View className="flex-1 justify-center p-4">
          <StatePanel
            action={<Button label="Browse the marketplace" onPress={() => router.replace('/browse')} />}
            body="Add something to your cart before checking out."
            title="Nothing to check out"
            tone="empty"
          />
        </View>
      </Screen>
    )
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar showBack showCart={false} showSearch={false} title="Checkout" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="gap-4 p-4 pb-8" keyboardShouldPersistTaps="handled">
          {!user?.isEmailVerified && (
            <InlineNotice title="Verify your email to check out" tone="warning">
              Foose requires a verified email before payment can be initialized.
            </InlineNotice>
          )}

          {!!error && <InlineNotice title="Checkout failed" tone="error">{error}</InlineNotice>}

          {shopGroups.map((group, groupIndex) => {
            const state = deliveryFor(group.shopId)
            const shopOption = options.data?.shops.find((shop) => shop.shopId === group.shopId)

            return (
              <View className="gap-3 rounded-xl border border-foose-border bg-foose-surface p-4" key={group.shopId}>
                <View className="flex-row items-center gap-2.5 border-b border-foose-border pb-3">
                  <View className="size-8 items-center justify-center rounded-lg bg-accent-light">
                    <Ionicons color={colors.accent} name="storefront-outline" size={16} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-sm font-black text-foose-text" numberOfLines={1}>
                      {group.shopName}
                      {!!shopOption?.location.city && ` · ${shopOption.location.city}, ${shopOption.location.region}`}
                    </Text>
                    <Text className="text-xs text-foose-muted">
                      Seller {groupIndex + 1} of {shopGroups.length} · {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                    </Text>
                  </View>
                </View>
                {group.items.map((item) => {
                  const agreed = bargainPrices[item.listingId]
                  const unitPrice = agreed === undefined ? item.price : Math.min(agreed, item.price)
                  const bargained = unitPrice < item.price
                  return (
                    <View className="flex-row items-start justify-between gap-3" key={item.listingId}>
                      <Text className="min-w-0 flex-1 text-xs text-foose-muted" numberOfLines={1}>
                        {item.title}
                        {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                      </Text>
                      <View className="items-end">
                        <View className="flex-row items-baseline gap-2">
                          {bargained && (
                            <Text className="text-[11px] font-semibold text-foose-muted line-through">
                              {formatMoney(item.price * item.quantity, item.currency)}
                            </Text>
                          )}
                          <Text className="text-xs font-black text-foose-text">
                            {formatMoney(unitPrice * item.quantity, item.currency)}
                          </Text>
                        </View>
                        {bargained && <Text className="text-[10px] font-bold text-foose-success">Bargained price</Text>}
                      </View>
                      <Pressable
                        accessibilityLabel={`Remove ${item.title} from checkout`}
                        accessibilityRole="button"
                        hitSlop={8}
                        onPress={() => cart.removeItem(item.listingId)}
                      >
                        <Text className="text-[11px] font-black text-foose-danger">Remove</Text>
                      </Pressable>
                    </View>
                  )
                })}

                <Dropdown<DeliveryMethod>
                  label="Delivery method"
                  onChange={(nextMethod) => updateDelivery(group.shopId, { method: nextMethod })}
                  options={[
                    { label: 'Bus station', value: 'station_pickup' },
                    { label: 'Pick up at shop', value: 'shop_pickup' },
                  ]}
                  value={state.method}
                />

                {state.method === 'shop_pickup' ? (
                  <Text className="text-xs text-foose-muted">
                    Collect from {shopOption?.location.city || 'the seller'}
                    {shopOption?.location.region ? `, ${shopOption.location.region}` : ''} and pay on pickup or online.
                  </Text>
                ) : (
                  <View className="gap-3">
                    <Dropdown
                      label="Station company"
                      onChange={(company) => updateDelivery(group.shopId, { company })}
                      options={STATION_COMPANIES.map((company) => ({ label: company, value: company }))}
                      value={state.company}
                    />
                    <Input
                      label="Recipient name"
                      onChangeText={(value) => updateDelivery(group.shopId, { recipientName: value })}
                      value={state.recipientName}
                    />
                    <Input
                      keyboardType="phone-pad"
                      label="Recipient phone"
                      onChangeText={(value) => updateDelivery(group.shopId, { recipientPhone: value })}
                      value={state.recipientPhone}
                    />
                    <Input
                      label="Region"
                      onChangeText={(value) => updateDelivery(group.shopId, { region: value })}
                      value={state.region}
                    />
                    <Input
                      label="Town"
                      onChangeText={(value) => updateDelivery(group.shopId, { town: value })}
                      value={state.town}
                    />
                    <Input
                      hint="Optional — the station branch that is easiest for you."
                      label="Preferred terminal"
                      onChangeText={(value) => updateDelivery(group.shopId, { preferredTerminal: value })}
                      value={state.preferredTerminal}
                    />
                  </View>
                )}
              </View>
            )
          })}

          {allShopPickup && (
            <View className="gap-2 rounded-xl border border-foose-border bg-foose-surface p-4">
              <Text className="text-sm font-black text-foose-text">Payment</Text>
              <Dropdown<'cash_on_pickup' | 'paystack'>
                onChange={setPaymentMethod}
                options={[
                  { label: 'Pay online', value: 'paystack' },
                  { label: 'Cash on pickup', value: 'cash_on_pickup' },
                ]}
                value={paymentMethod}
              />
            </View>
          )}
        </ScrollView>

        <View className="gap-2 border-t border-foose-border bg-foose-surface p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-foose-muted">Items subtotal</Text>
            <Text className="text-lg font-black text-foose-text">{formatMoney(bargainedSubtotal)}</Text>
          </View>
          <Button
            disabled={Boolean(incompleteGroup) || !user?.isEmailVerified}
            full
            label={resolvedPaymentMethod === 'cash_on_pickup' ? 'Place pickup order' : 'Pay with Paystack'}
            loading={submitting}
            onPress={() => void submit()}
          />
          {!!incompleteGroup && (
            <Text className="text-center text-xs text-foose-faint">
              Add delivery details for {incompleteGroup.shopName} to continue.
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}
