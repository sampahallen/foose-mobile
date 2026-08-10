import { router } from 'expo-router'
import { useState } from 'react'
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native'
import { AuthRequired } from '../components/auth/AuthRequired'
import { ListSkeleton } from '../components/feedback/Skeleton'
import { StatePanel } from '../components/feedback/StatePanel'
import { Screen } from '../components/layout/Screen'
import { TopBar } from '../components/layout/TopBar'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'
import { useApiResource } from '../hooks/useApiResource'
import { useThemeColors } from '../hooks/useThemeColors'
import type { Order } from '../types/api'
import { formatDate, formatMoney } from '../utils/format'
import { orderProgressLabel, orderStatusTone, orderTitle } from '../utils/orderStatus'

type OrderBucket = 'active' | 'history'

type OrdersPage = {
  hasMore: boolean
  nextCursor: string | null
  orders: Order[]
  serverNow: string
}

function OrdersContent() {
  const colors = useThemeColors()
  const [bucket, setBucket] = useState<OrderBucket>('active')
  const orders = useApiResource<OrdersPage>(
    `/orders/me/buying?bucket=${bucket}&limit=25&sort=${bucket === 'active' ? 'urgency' : 'newest'}`,
  )

  return (
    <>
      <View className="flex-row gap-2 border-b border-foose-border bg-foose-surface px-4 py-3">
        <Chip active={bucket === 'active'} label="Active" onPress={() => setBucket('active')} />
        <Chip active={bucket === 'history'} label="History" onPress={() => setBucket('history')} />
      </View>

      <FlatList
        contentContainerClassName="gap-3 p-4 pb-10"
        data={orders.data?.orders || []}
        keyExtractor={(order) => order._id}
        ListEmptyComponent={
          orders.initialLoading ? (
            <ListSkeleton />
          ) : (
            <StatePanel
              action={
                bucket === 'active' ? <Button label="Browse the marketplace" onPress={() => router.push('/browse')} /> : undefined
              }
              body={orders.error || (bucket === 'active' ? 'Orders you place appear here while they are in progress.' : 'Completed and cancelled orders land here.')}
              title={orders.error ? 'Orders could not load' : bucket === 'active' ? 'No active orders' : 'No past orders'}
              tone={orders.error ? 'error' : 'empty'}
            />
          )
        }
        refreshControl={
          <RefreshControl onRefresh={() => void orders.refetch()} refreshing={orders.refreshing} tintColor={colors.accent} />
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            className="gap-2 rounded-xl border border-foose-border bg-foose-surface p-4 active:opacity-80"
            onPress={() => router.push(`/order/${item._id}`)}
          >
            <View className="flex-row items-center justify-between gap-2">
              <Badge label={orderProgressLabel(item)} tone={orderStatusTone(item)} />
              <Text className="text-xs text-foose-faint">{formatDate(item.createdAt)}</Text>
            </View>
            <Text className="text-sm font-bold text-foose-text" numberOfLines={2}>
              {orderTitle(item)}
            </Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-foose-muted">
                {item.items.length} item{item.items.length === 1 ? '' : 's'}
              </Text>
              <Text className="text-sm font-black text-accent">{formatMoney(item.totalAmount, item.currency)}</Text>
            </View>
          </Pressable>
        )}
      />
    </>
  )
}

export default function OrdersScreen() {
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar showBack showCart={false} showSearch={false} title="Your orders" />
      <AuthRequired body="Sign in to track the orders you have placed." title="Your orders">
        <OrdersContent />
      </AuthRequired>
    </Screen>
  )
}
