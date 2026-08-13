import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native'
import { StatePanel } from '../components/feedback/StatePanel'
import { Screen } from '../components/layout/Screen'
import { useThemeColors } from '../hooks/useThemeColors'
import { apiGet } from '../lib/api'
import type { PopularSearch, UnifiedSearchSuggestion } from '../types/api'
import { useApiResource } from '../hooks/useApiResource'

// Mirrors web's `SUGGESTION_FILTERS` (`frontend/src/components/search/BrowseSearchCombobox.tsx`) — the
// active marketplace filters browse.tsx passes as route params when it links here, forwarded into the
// suggestions call so results stay scoped to what the user was already filtering by.
const SUGGESTION_FILTER_KEYS = [
  'type', 'category', 'subcategory', 'brand', 'condition', 'color', 'gender',
  'size', 'minPrice', 'maxPrice', 'location', 'material', 'fit', 'pattern', 'baleGrade',
] as const

/** Routes a suggestion to the screen that owns that entity type. */
function openSuggestion(suggestion: UnifiedSearchSuggestion) {
  const entityId = suggestion.sourceId || (suggestion.entity as { _id?: string } | undefined)?._id

  if (suggestion.type === 'item' && entityId) {
    router.push(`/listing/${entityId}`)
    return
  }
  if (suggestion.type === 'finspo' && entityId) {
    router.push(`/finspo/${entityId}`)
    return
  }
  if (suggestion.type === 'event' && entityId) {
    router.push(`/event/${entityId}`)
    return
  }
  if (suggestion.type === 'hashtag' && suggestion.hashtag) {
    router.push(`/browse?q=${encodeURIComponent(`#${suggestion.hashtag}`)}`)
    return
  }
  router.push(`/browse?q=${encodeURIComponent(suggestion.keyword || suggestion.label)}`)
}

export default function SearchScreen() {
  const colors = useThemeColors()
  const filterParams = useLocalSearchParams<Partial<Record<(typeof SUGGESTION_FILTER_KEYS)[number], string>>>()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<UnifiedSearchSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const popularSearches = useApiResource<{ searches: PopularSearch[] }>('/search/popular-searches?limit=8')

  // The suggestions endpoint requires at least 2 characters; debounce so typing does not spam it.
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      // Deferred so the effect never sets state synchronously and cascades a second render pass.
      queueMicrotask(() => {
        setSuggestions([])
        setLoading(false)
      })
      return
    }

    queueMicrotask(() => setLoading(true))
    const controller = new AbortController()
    const timer = setTimeout(() => {
      const search = new URLSearchParams({ limit: '12', q: trimmed })
      for (const key of SUGGESTION_FILTER_KEYS) {
        const value = filterParams[key]
        if (typeof value === 'string' && value) search.set(key, value)
      }
      apiGet<{ suggestions: UnifiedSearchSuggestion[] }>(`/search/suggestions?${search.toString()}`, { signal: controller.signal })
        .then((data) => setSuggestions(data.suggestions || []))
        .catch(() => undefined)
        .finally(() => setLoading(false))
    }, 250)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
    // `filterParams` come from the route and are fixed for the life of this screen; the debounce
    // itself should only re-run when the typed query changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <Screen edges={['top', 'bottom']} topInsetClassName="bg-foose-surface">
      <View className="flex-row items-center gap-2 border-b border-foose-border bg-foose-surface px-4 py-3">
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          className="size-9 items-center justify-center rounded-full"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        >
          <Ionicons color={colors.text} name="chevron-back" size={22} />
        </Pressable>
        <View className="min-h-11 flex-1 flex-row items-center gap-2 rounded-xl border border-foose-border bg-foose-surface-low px-3">
          <Ionicons color={colors.accent} name="search" size={18} />
          <TextInput
            autoFocus
            className="flex-1 text-sm text-foose-text"
            onChangeText={setQuery}
            onSubmitEditing={() => query.trim() && router.replace(`/browse?q=${encodeURIComponent(query.trim())}`)}
            placeholder="Search items, looks, shops…"
            placeholderTextColor={colors.faint}
            returnKeyType="search"
            value={query}
          />
          {loading && <ActivityIndicator color={colors.faint} size="small" />}
        </View>
      </View>

      {query.trim().length < 2 ? (
        <FlatList
          contentContainerClassName="gap-2 p-4"
          data={popularSearches.data?.searches || []}
          keyExtractor={(search) => search.normalizedQuery}
          ListEmptyComponent={
            <StatePanel body="Start typing to search items, Finspo looks, events, and shops." title="Search Foose" tone="info" />
          }
          ListHeaderComponent={<Text className="mb-1 text-xs font-black uppercase tracking-wide text-foose-faint">Popular searches</Text>}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-xl border border-foose-border bg-foose-surface p-3 active:opacity-80"
              onPress={() => router.replace(`/browse?q=${encodeURIComponent(item.query)}`)}
            >
              <Ionicons color={colors.faint} name="trending-up" size={16} />
              <Text className="min-w-0 flex-1 text-sm text-foose-text">{item.query}</Text>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          contentContainerClassName="gap-2 p-4"
          data={suggestions}
          keyExtractor={(suggestion, index) => `${suggestion.type}-${suggestion.sourceId || suggestion.label}-${index}`}
          ListEmptyComponent={
            loading ? null : (
              <StatePanel
                body={`Nothing matched “${query.trim()}”. Try a shorter search.`}
                title="No suggestions"
                tone="empty"
              />
            )
          }
          ListFooterComponent={
            <Pressable
              accessibilityRole="button"
              className="mt-2 items-center rounded-xl border border-foose-border bg-foose-surface p-3 active:opacity-80"
              onPress={() => router.replace(`/browse?q=${encodeURIComponent(query.trim())}`)}
            >
              <Text className="text-sm font-black text-accent">See all marketplace results</Text>
            </Pressable>
          }
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              className="flex-row items-center gap-3 rounded-xl border border-foose-border bg-foose-surface p-3 active:opacity-80"
              onPress={() => openSuggestion(item)}
            >
              {item.imageUrl ? (
                <Image
                  accessibilityIgnoresInvertColors
                  className="rounded-lg bg-foose-surface-mid"
                  contentFit="cover"
                  source={{ uri: item.imageUrl }}
                  style={{ height: 40, width: 40 }}
                />
              ) : (
                <View className="size-10 items-center justify-center rounded-lg bg-accent-light">
                  <Ionicons color={colors.accent} name="search" size={16} />
                </View>
              )}
              <View className="min-w-0 flex-1">
                <Text className="text-sm font-semibold text-foose-text" numberOfLines={1}>
                  {item.label}
                </Text>
                {!!item.subtitle && (
                  <Text className="text-xs text-foose-muted" numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                )}
              </View>
              <Text className="text-[10px] font-black uppercase text-foose-faint">{item.type}</Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  )
}
