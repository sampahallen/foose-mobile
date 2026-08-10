import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from 'react-native'
import { ListSkeleton, SkeletonBlock } from '../../components/feedback/Skeleton'
import { StatePanel } from '../../components/feedback/StatePanel'
import { Screen } from '../../components/layout/Screen'
import { TopBar } from '../../components/layout/TopBar'
import { Badge } from '../../components/ui/Badge'
import { Chip } from '../../components/ui/Chip'
import { useInfiniteApiResource } from '../../hooks/useInfiniteApiResource'
import { useThemeColors } from '../../hooks/useThemeColors'
import type { Event, GalleryPost } from '../../types/api'
import { finspoCoverImage } from '../../utils/finspoImages'
import { formatDate } from '../../utils/format'

type CommunityTab = 'finspo' | 'events'

type GalleryFeed = { posts: GalleryPost[]; page: number; pages: number; total: number }
type EventFeed = { events: Event[]; page: number; pages: number; total: number }

function FinspoFeed() {
  const colors = useThemeColors()
  const buildPath = useCallback((page: number) => `/community/gallery?page=${page}&limit=18`, [])
  const extract = useCallback((data: GalleryFeed) => data.posts || [], [])
  const feed = useInfiniteApiResource<GalleryPost, GalleryFeed>(buildPath, extract, ['finspo'])

  return (
    <FlatList
      columnWrapperClassName="gap-1"
      contentContainerClassName="gap-1 p-1 pb-10"
      data={feed.items}
      keyExtractor={(post) => post._id}
      ListEmptyComponent={
        feed.loading ? (
          <View className="flex-row flex-wrap gap-1 p-1">
            {Array.from({ length: 9 }).map((_, index) => (
              <SkeletonBlock className="aspect-square w-[32.5%]" key={index} />
            ))}
          </View>
        ) : (
          <View className="p-3">
            <StatePanel
              body={feed.error || 'Finspo looks will appear here as the community posts them.'}
              title={feed.error ? 'Finspo could not load' : 'No Finspo posts yet'}
              tone={feed.error ? 'error' : 'empty'}
            />
          </View>
        )
      }
      ListFooterComponent={
        feed.loadingMore ? (
          <View className="py-6">
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : null
      }
      numColumns={3}
      onEndReached={feed.loadMore}
      onEndReachedThreshold={0.6}
      refreshControl={<RefreshControl onRefresh={() => void feed.refetch()} refreshing={feed.refreshing} tintColor={colors.accent} />}
      renderItem={({ item }) => (
        <Pressable
          accessibilityLabel={item.caption || 'Finspo post'}
          accessibilityRole="button"
          className="aspect-square flex-1 bg-foose-surface-mid active:opacity-80"
          onPress={() => router.push(`/finspo/${item._id}`)}
        >
          <Image accessibilityIgnoresInvertColors contentFit="cover" source={{ uri: finspoCoverImage(item) }} style={{ flex: 1 }} />
        </Pressable>
      )}
    />
  )
}

function EventFeedList() {
  const colors = useThemeColors()
  const buildPath = useCallback((page: number) => `/community/events?page=${page}&limit=12`, [])
  const extract = useCallback((data: EventFeed) => data.events || [], [])
  const feed = useInfiniteApiResource<Event, EventFeed>(buildPath, extract, ['events'])

  return (
    <FlatList
      contentContainerClassName="gap-3 p-4 pb-10"
      data={feed.items}
      keyExtractor={(event) => event._id}
      ListEmptyComponent={
        feed.loading ? (
          <ListSkeleton />
        ) : (
          <StatePanel
            body={feed.error || 'Pop-ups and fairs will appear here once organizers publish them.'}
            title={feed.error ? 'Events could not load' : 'No events yet'}
            tone={feed.error ? 'error' : 'empty'}
          />
        )
      }
      ListFooterComponent={
        feed.loadingMore ? (
          <View className="py-6">
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : null
      }
      onEndReached={feed.loadMore}
      onEndReachedThreshold={0.6}
      refreshControl={<RefreshControl onRefresh={() => void feed.refetch()} refreshing={feed.refreshing} tintColor={colors.accent} />}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          className="overflow-hidden rounded-xl border border-foose-border bg-foose-surface active:opacity-80"
          onPress={() => router.push(`/event/${item._id}`)}
        >
          {!!item.coverImage && (
            <Image
              accessibilityIgnoresInvertColors
              contentFit="cover"
              source={{ uri: item.coverImage }}
              style={{ height: 140, width: '100%' }}
            />
          )}
          <View className="gap-1.5 p-3.5">
            <View className="flex-row items-center gap-2">
              <Badge label={item.type.replace(/-/g, ' ')} />
              {!!item.status && <Badge label={item.status} tone={item.status === 'past' ? 'neutral' : 'success'} />}
            </View>
            <Text className="text-base font-bold text-foose-text" numberOfLines={2}>
              {item.title}
            </Text>
            <Text className="text-xs text-foose-muted">
              {formatDate(item.startsAt || item.date)}
              {item.location ? ` · ${item.location}` : ''}
            </Text>
          </View>
        </Pressable>
      )}
    />
  )
}

export default function CommunityScreen() {
  const [tab, setTab] = useState<CommunityTab>('finspo')

  return (
    <Screen>
      <TopBar showCart={false} title="Community" />
      <View className="flex-row gap-2 border-b border-foose-border bg-foose-surface px-4 py-3">
        <Chip active={tab === 'finspo'} label="Finspo" onPress={() => setTab('finspo')} />
        <Chip active={tab === 'events'} label="Events" onPress={() => setTab('events')} />
      </View>
      {tab === 'finspo' ? <FinspoFeed /> : <EventFeedList />}
    </Screen>
  )
}
