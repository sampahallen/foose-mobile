import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { StatePanel } from '../components/feedback/StatePanel'
import { Screen } from '../components/layout/Screen'
import { TopBar } from '../components/layout/TopBar'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { useAcceptedBargainPrices } from '../hooks/useBargain'
import { useCart } from '../hooks/useCart'
import { formatMoney } from '../utils/format'

export default function CartScreen() {
  const cart = useCart()
  const { user } = useAuth()
  // Preview only — the server resolves the real price when the order is placed.
  const bargainPrices = useAcceptedBargainPrices(Boolean(user) && cart.items.length > 0)
  const subtotal = cart.items.reduce((sum, item) => {
    const agreed = bargainPrices[item.listingId]
    return sum + (agreed === undefined ? item.price : Math.min(agreed, item.price)) * item.quantity
  }, 0)

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar
        action={
          cart.items.length ? <Button label="Clear" onPress={cart.clearCart} size="sm" variant="ghost" /> : undefined
        }
        showBack
        showCart={false}
        showSearch={false}
        title="Cart"
      />

      {cart.items.length === 0 ? (
        <View className="flex-1 justify-center p-4">
          <StatePanel
            action={<Button label="Browse the marketplace" onPress={() => router.replace('/browse')} />}
            body="Add a piece from any listing and it shows up here."
            title="Your cart is empty"
            tone="empty"
          />
        </View>
      ) : (
        <>
          <ScrollView contentContainerClassName="gap-3 p-4">
            {cart.items.map((item) => {
              const agreed = bargainPrices[item.listingId]
              const unitPrice = agreed === undefined ? item.price : Math.min(agreed, item.price)
              const bargained = unitPrice < item.price
              return (
              <View className="flex-row gap-3 rounded-xl border border-foose-border bg-foose-surface p-3" key={item.listingId}>
                <Pressable
                  accessibilityLabel={item.title}
                  accessibilityRole="button"
                  onPress={() => router.push(`/listing/${item.listingId}`)}
                >
                  <Image
                    accessibilityIgnoresInvertColors
                    className="rounded-lg bg-foose-surface-mid"
                    contentFit="cover"
                    source={{ uri: item.image }}
                    style={{ height: 72, width: 60 }}
                  />
                </Pressable>
                <View className="min-w-0 flex-1 gap-1">
                  <Text className="text-sm font-bold text-foose-text" numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text className="text-xs text-foose-muted" numberOfLines={1}>
                    {item.shopName}
                  </Text>
                  <View className="flex-row items-baseline gap-2">
                    {bargained && (
                      <Text className="text-xs font-semibold text-foose-muted line-through">
                        {formatMoney(item.price, item.currency)}
                      </Text>
                    )}
                    <Text className="text-sm font-black text-accent">{formatMoney(unitPrice, item.currency)}</Text>
                  </View>
                  {bargained && <Text className="text-[11px] font-bold text-foose-success">Bargained</Text>}
                  {item.type === 'wholesale' ? (
                    <View className="mt-1 flex-row items-center gap-2 self-start rounded-lg border border-foose-border px-1">
                      <Pressable
                        accessibilityLabel="Decrease quantity"
                        accessibilityRole="button"
                        className="size-8 items-center justify-center"
                        onPress={() => cart.updateQuantity(item.listingId, item.quantity - 1)}
                      >
                        <Text className="text-base font-bold text-foose-text">−</Text>
                      </Pressable>
                      <Text className="min-w-6 text-center text-sm font-bold text-foose-text">{item.quantity}</Text>
                      <Pressable
                        accessibilityLabel="Increase quantity"
                        accessibilityRole="button"
                        className="size-8 items-center justify-center"
                        onPress={() => cart.updateQuantity(item.listingId, item.quantity + 1)}
                      >
                        <Text className="text-base font-bold text-foose-text">+</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Text className="text-xs text-foose-faint">One-of-a-kind · quantity 1</Text>
                  )}
                </View>
                <Pressable
                  accessibilityLabel={`Remove ${item.title}`}
                  accessibilityRole="button"
                  className="self-start p-1"
                  onPress={() => cart.removeItem(item.listingId)}
                >
                  <Text className="text-xs font-black text-foose-danger">Remove</Text>
                </Pressable>
              </View>
              )
            })}
          </ScrollView>

          <View className="gap-3 border-t border-foose-border bg-foose-surface p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-foose-muted">Subtotal</Text>
              <Text className="text-lg font-black text-foose-text">{formatMoney(subtotal)}</Text>
            </View>
            <Text className="text-xs text-foose-faint">Delivery is calculated per seller at checkout.</Text>
            <Button
              full
              label={user ? 'Checkout' : 'Sign in to checkout'}
              onPress={() => router.push(user ? '/checkout' : '/login')}
            />
          </View>
        </>
      )}
    </Screen>
  )
}
