import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useState } from 'react'
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { AuthRequired } from '../../components/auth/AuthRequired'
import { ProductGridSkeleton } from '../../components/feedback/Skeleton'
import { StatePanel } from '../../components/feedback/StatePanel'
import { Screen } from '../../components/layout/Screen'
import { TopBar } from '../../components/layout/TopBar'
import { ProductGrid } from '../../components/marketplace/ProductGrid'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { useApiResource } from '../../hooks/useApiResource'
import { useThemeColors } from '../../hooks/useThemeColors'
import type { FavoriteCollections } from '../../types/api'
import { finspoCoverImage } from '../../utils/finspoImages'
import { formatDate } from '../../utils/format'

type SavedTab = 'items' | 'finspos' | 'events'

function SavedContent() {
  const colors = useThemeColors()
  const [tab, setTab] = useState<SavedTab>('items')
  const favorites = useApiResource<FavoriteCollections>('/favorites')
  const data = favorites.data

  return (
    <>
      <View className="flex-row gap-2 border-b border-foose-border bg-foose-surface px-4 py-3">
        <Chip active={tab === 'items'} label={`Items${data ? ` (${data.listings.length})` : ''}`} onPress={() => setTab('items')} />
        <Chip active={tab === 'finspos'} label={`Finspo${data ? ` (${data.finspos.length})` : ''}`} onPress={() => setTab('finspos')} />
        <Chip active={tab === 'events'} label={`Events${data ? ` (${data.events.length})` : ''}`} onPress={() => setTab('events')} />
      </View>

      <ScrollView
        contentContainerClassName="gap-3 p-4 pb-10"
        refreshControl={
          <RefreshControl onRefresh={() => void favorites.refetch()} refreshing={favorites.refreshing} tintColor={colors.accent} />
        }
      >
        {favorites.initialLoading && <ProductGridSkeleton count={4} />}

        {!!favorites.error && (
          <StatePanel
            action={<Button label="Try again" onPress={() => void favorites.refetch()} variant="secondary" />}
            body={favorites.error}
            title="Saved items could not load"
            tone="error"
          />
        )}

        {!favorites.loading && !favorites.error && tab === 'items' && (
          data?.listings.length ? (
            <ProductGrid listings={data.listings} />
          ) : (
            <StatePanel
              action={<Button label="Explore the marketplace" onPress={() => router.push('/browse')} />}
              body="Tap the heart on any listing to keep it here."
              title="Nothing saved yet"
              tone="empty"
            />
          )
        )}

        {!favorites.loading && !favorites.error && tab === 'finspos' && (
          data?.finspos.length ? (
            <View className="flex-row flex-wrap gap-1">
              {data.finspos.map((post) => (
                <Pressable
                  accessibilityRole="button"
                  className="aspect-square w-[32.5%] bg-foose-surface-mid active:opacity-80"
                  key={post._id}
                  onPress={() => router.push(`/finspo/${post._id}`)}
                >
                  <Image accessibilityIgnoresInvertColors contentFit="cover" source={{ uri: finspoCoverImage(post) }} style={{ flex: 1 }} />
                </Pressable>
              ))}
            </View>
          ) : (
            <StatePanel body="Save Finspo looks from the Community tab." title="No saved Finspo" tone="empty" />
          )
        )}

        {!favorites.loading && !favorites.error && tab === 'events' && (
          data?.events.length ? (
            data.events.map((event) => (
              <Pressable
                accessibilityRole="button"
                className="gap-1.5 rounded-xl border border-foose-border bg-foose-surface p-3.5 active:opacity-80"
                key={event._id}
                onPress={() => router.push(`/event/${event._id}`)}
              >
                <Badge label={event.type.replace(/-/g, ' ')} />
                <Text className="text-base font-bold text-foose-text" numberOfLines={2}>
                  {event.title}
                </Text>
                <Text className="text-xs text-foose-muted">{formatDate(event.startsAt || event.date)}</Text>
              </Pressable>
            ))
          ) : (
            <StatePanel body="Save pop-ups and fairs so you do not miss them." title="No saved events" tone="empty" />
          )
        )}
      </ScrollView>
    </>
  )
}

export default function SavedScreen() {
  return (
    <Screen>
      <TopBar showSearch={false} title="Saved" />
      <AuthRequired body="Sign in to see the listings, looks, and events you saved." title="Your saved items">
        <SavedContent />
      </AuthRequired>
    </Screen>
  )
}
