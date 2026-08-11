import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { InlineNotice } from '../../components/feedback/InlineNotice'
import { StatePanel } from '../../components/feedback/StatePanel'
import { useToast } from '../../components/feedback/ToastProvider'
import { Screen } from '../../components/layout/Screen'
import { TopBar } from '../../components/layout/TopBar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useApiResource } from '../../hooks/useApiResource'
import { useThemeColors } from '../../hooks/useThemeColors'
import { apiPost } from '../../lib/api'
import type { Order } from '../../types/api'
import { getErrorMessage } from '../../utils/errorMessage'
import { formatDateTime, formatMoney } from '../../utils/format'
import {
  buyerOrderActions,
  deliveryMethodLabel,
  orderAddress,
  orderDeliveryFee,
  orderProgressLabel,
  orderSettlementLabel,
  orderStatusTone,
} from '../../utils/orderStatus'

/** Module scope, not the component body: `Date.now()` must not run during render. */
function createOrderIdempotencyKey(orderId: string, action: string) {
  return `order:${orderId}:${action}:${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const colors = useThemeColors()
  const { showToast } = useToast()
  const orderResource = useApiResource<{ order: Order }>(id ? `/orders/${encodeURIComponent(id)}` : null)
  const order = orderResource.data?.order
  const [busyAction, setBusyAction] = useState('')

  async function runAction(endpoint: string, action: string) {
    if (!order || busyAction) return
    setBusyAction(action)
    try {
      await apiPost(`/orders/${encodeURIComponent(order._id)}/actions/${endpoint}`, {}, {
        // Retrying a tapped action must not double-apply it server-side.
        headers: { 'Idempotency-Key': createOrderIdempotencyKey(order._id, action) },
      })
      await orderResource.refetch()
      showToast('Order updated', 'success')
    } catch (requestError) {
      showToast(getErrorMessage(requestError, 'Could not update this order'), 'error')
    } finally {
      setBusyAction('')
    }
  }

  if (orderResource.initialLoading) {
    return (
      <Screen edges={['top', 'bottom']}>
        <TopBar showBack showCart={false} showSearch={false} title="Order" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    )
  }

  if (!order) {
    return (
      <Screen edges={['top', 'bottom']}>
        <TopBar showBack showCart={false} showSearch={false} title="Order" />
        <View className="p-4">
          <StatePanel
            action={<Button label="View orders" onPress={() => router.replace('/orders')} />}
            body={orderResource.error || 'This order could not be found.'}
            title="Order unavailable"
            tone={orderResource.error ? 'error' : 'empty'}
          />
        </View>
      </Screen>
    )
  }

  const actions = buyerOrderActions(order)
  const address = orderAddress(order)
  const deliveryFeeAmount = orderDeliveryFee(order)

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar showBack showCart={false} showSearch={false} title={`Order ${order._id.slice(-6).toUpperCase()}`} />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-8">
        <View className="gap-2 rounded-xl border border-foose-border bg-foose-surface p-4">
          <Badge label={orderProgressLabel(order)} tone={orderStatusTone(order)} />
          <Text className="text-xs text-foose-muted">
            {orderSettlementLabel(order.settlementStatus, order.paymentMethod)}
          </Text>
          {!!order.workflow?.settlementExplanation && (
            <Text className="text-xs text-foose-muted">{order.workflow.settlementExplanation}</Text>
          )}
          {!!order.workflow?.deadline && (
            <InlineNotice title={`Due ${formatDateTime(order.workflow.deadline.at)}`} tone="warning">
              {order.workflow.deadline.consequence || ''}
            </InlineNotice>
          )}
        </View>

        <View className="gap-3 rounded-xl border border-foose-border bg-foose-surface p-4">
          <Text className="text-sm font-black text-foose-text">Items</Text>
          {order.items.map((item, index) => (
            <View className="flex-row items-start justify-between gap-3" key={item._id || `${item.title}-${index}`}>
              <View className="min-w-0 flex-1">
                <Text className="text-sm text-foose-text" numberOfLines={2}>
                  {item.title}
                </Text>
                <Text className="text-xs text-foose-faint">Qty {item.quantity}</Text>
              </View>
              <Text className="text-sm font-bold text-foose-text">{formatMoney(item.price * item.quantity, order.currency)}</Text>
            </View>
          ))}
          <View className="gap-1 border-t border-foose-border pt-3">
            {order.subtotalAmount !== undefined && (
              <View className="flex-row justify-between">
                <Text className="text-xs text-foose-muted">Subtotal</Text>
                <Text className="text-xs text-foose-text">{formatMoney(order.subtotalAmount, order.currency)}</Text>
              </View>
            )}
            {deliveryFeeAmount !== 0 && (
              <View className="flex-row justify-between">
                <Text className="text-xs text-foose-muted">Delivery</Text>
                <Text className="text-xs text-foose-text">
                  {deliveryFeeAmount === null ? 'TBD' : formatMoney(deliveryFeeAmount, order.currency)}
                </Text>
              </View>
            )}
            <View className="flex-row justify-between">
              <Text className="text-sm font-black text-foose-text">Total</Text>
              <Text className="text-sm font-black text-accent">{formatMoney(order.totalAmount, order.currency)}</Text>
            </View>
          </View>
        </View>

        <View className="gap-1.5 rounded-xl border border-foose-border bg-foose-surface p-4">
          <Text className="text-sm font-black text-foose-text">{deliveryMethodLabel(order.delivery?.method)}</Text>
          {!!order.delivery?.company && <Text className="text-xs text-foose-muted">{order.delivery.company}</Text>}
          {!!address && <Text className="text-xs text-foose-muted">{address}</Text>}
          {!!order.delivery?.transit?.busNumber && (
            <Text className="text-xs text-foose-muted">Bus {order.delivery.transit.busNumber}</Text>
          )}
          {!!order.delivery?.transit?.driverPhone && (
            <Text className="text-xs text-foose-muted">Driver {order.delivery.transit.driverPhone}</Text>
          )}
        </View>

        {!!actions.length && (
          <View className="gap-2">
            {actions.map((item) => (
              <Button
                full
                key={item.action}
                label={item.label}
                loading={busyAction === item.action}
                onPress={() => void runAction(item.endpoint, item.action)}
                variant={item.action === 'cancel_cash_pickup' ? 'secondary' : 'primary'}
              />
            ))}
            <Text className="text-center text-xs text-foose-faint">
              Reporting a problem and uploading evidence is available on the Foose web app.
            </Text>
          </View>
        )}
      </ScrollView>
    </Screen>
  )
}
