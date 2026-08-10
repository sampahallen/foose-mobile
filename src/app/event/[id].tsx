import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { StatePanel } from '../../components/feedback/StatePanel'
import { Screen } from '../../components/layout/Screen'
import { TopBar } from '../../components/layout/TopBar'
import { ProductGrid } from '../../components/marketplace/ProductGrid'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { FavoriteButton } from '../../components/ui/FavoriteButton'
import { useApiResource } from '../../hooks/useApiResource'
import { useThemeColors } from '../../hooks/useThemeColors'
import type { Event, Listing } from '../../types/api'
import { formatDate } from '../../utils/format'

function isPopulatedListing(value: Listing | string): value is Listing {
  return typeof value === 'object'
}

export default function EventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const colors = useThemeColors()
  const eventResource = useApiResource<{ event: Event }>(id ? `/community/events/${encodeURIComponent(id)}` : null)
  const event = eventResource.data?.event

  if (eventResource.initialLoading) {
    return (
      <Screen edges={['top', 'bottom']}>
        <TopBar showBack showCart={false} title="Event" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    )
  }

  if (!event) {
    return (
      <Screen edges={['top', 'bottom']}>
        <TopBar showBack showCart={false} title="Event" />
        <View className="p-4">
          <StatePanel
            action={<Button label="Back to community" onPress={() => router.replace('/community')} />}
            body={eventResource.error || 'This event may have been removed.'}
            title="Event unavailable"
            tone={eventResource.error ? 'error' : 'empty'}
          />
        </View>
      </Screen>
    )
  }

  const eventListings = (event.eventListings || []).filter(isPopulatedListing)

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar showBack showCart={false} title={event.title} />
      <ScrollView contentContainerClassName="pb-10">
        {!!event.coverImage && (
          <View>
            <Image accessibilityIgnoresInvertColors contentFit="cover" source={{ uri: event.coverImage }} style={{ height: 200, width: '100%' }} />
            <FavoriteButton className="absolute right-3 top-3" size={40} targetId={event._id} targetType="event" />
          </View>
        )}

        <View className="gap-3 p-4">
          <View className="flex-row flex-wrap gap-2">
            <Badge label={event.type.replace(/-/g, ' ')} />
            {!!event.status && <Badge label={event.status} tone={event.status === 'past' ? 'neutral' : 'success'} />}
          </View>

          <Text className="text-xl font-bold text-foose-text">{event.title}</Text>
          <Text className="text-sm text-foose-muted">
            {formatDate(event.startsAt || event.date)}
            {event.startTime ? ` · ${event.startTime}` : ''}
            {event.endTime ? ` – ${event.endTime}` : ''}
          </Text>
          {!!event.location && <Text className="text-sm text-foose-muted">{event.location}</Text>}
          {!!event.description && <Text className="text-sm leading-5 text-foose-text">{event.description}</Text>}

          {!!eventListings.length && (
            <View className="mt-2">
              <Text className="mb-3 text-base font-bold text-foose-text">Shopping this event</Text>
              <ProductGrid listings={eventListings} />
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  )
}
