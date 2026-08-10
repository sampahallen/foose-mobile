import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Dimensions, Pressable, ScrollView, Text, View } from 'react-native'
import { StatePanel } from '../../components/feedback/StatePanel'
import { Screen } from '../../components/layout/Screen'
import { TopBar } from '../../components/layout/TopBar'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { useApiResource } from '../../hooks/useApiResource'
import { useAuth } from '../../hooks/useAuth'
import { useThemeColors } from '../../hooks/useThemeColors'
import { apiPost } from '../../lib/api'
import type { GalleryPost } from '../../types/api'
import { asUser, formatRelativeTime } from '../../utils/format'
import { finspoImages } from '../../utils/finspoImages'

export default function FinspoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const colors = useThemeColors()
  const width = Dimensions.get('window').width
  const postResource = useApiResource<{ post: GalleryPost }>(id ? `/community/gallery/${encodeURIComponent(id)}` : null)
  const post = postResource.data?.post
  // Like state is derived from the fetched post until the viewer taps; `override` then wins so the
  // toggle stays optimistic without an effect copying server data into state.
  const [override, setOverride] = useState<{ liked: boolean; likeCount: number } | null>(null)
  const serverLiked = Boolean(user && post?.likes?.includes(user._id))
  const liked = override?.liked ?? serverLiked
  const likeCount = override?.likeCount ?? (post?.likes?.length || 0)

  async function toggleLike() {
    if (!user) {
      router.push('/login')
      return
    }
    if (!post) return

    const next = !liked
    setOverride({ liked: next, likeCount: Math.max(0, likeCount + (next ? 1 : -1)) })

    try {
      await apiPost(`/community/gallery/${post._id}/like`)
    } catch {
      setOverride({ liked: !next, likeCount })
    }
  }

  if (postResource.initialLoading) {
    return (
      <Screen edges={['top', 'bottom']}>
        <TopBar showBack showCart={false} title="Finspo" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.accent} />
        </View>
      </Screen>
    )
  }

  if (!post) {
    return (
      <Screen edges={['top', 'bottom']}>
        <TopBar showBack showCart={false} title="Finspo" />
        <View className="p-4">
          <StatePanel
            action={<Button label="Back to community" onPress={() => router.replace('/community')} />}
            body={postResource.error || 'This look may have been archived or deleted.'}
            title="Post unavailable"
            tone={postResource.error ? 'error' : 'empty'}
          />
        </View>
      </Screen>
    )
  }

  const author = asUser(post.userId)
  const images = finspoImages(post)

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar showBack showCart={false} title="Finspo" />
      <ScrollView contentContainerClassName="pb-10">
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {images.map((image) => (
            <Image
              accessibilityIgnoresInvertColors
              contentFit="cover"
              key={image}
              source={{ uri: image }}
              style={{ height: width, width }}
            />
          ))}
        </ScrollView>

        <View className="gap-3 p-4">
          <View className="flex-row items-center gap-3">
            <Avatar name={author?.name} size={40} uri={author?.profilePhoto} />
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-bold text-foose-text" numberOfLines={1}>
                {author ? `@${author.username}` : 'Foose member'}
              </Text>
              <Text className="text-xs text-foose-faint">{formatRelativeTime(post.createdAt)}</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-4">
            <Pressable
              accessibilityLabel={liked ? 'Unlike' : 'Like'}
              accessibilityRole="button"
              className="flex-row items-center gap-1.5 active:opacity-70"
              onPress={() => void toggleLike()}
            >
              <Ionicons color={liked ? colors.danger : colors.text} name={liked ? 'heart' : 'heart-outline'} size={22} />
              <Text className="text-sm font-bold text-foose-text">{likeCount}</Text>
            </Pressable>
            <View className="flex-row items-center gap-1.5">
              <Ionicons color={colors.text} name="chatbubble-outline" size={20} />
              <Text className="text-sm font-bold text-foose-text">{post.commentCount || 0}</Text>
            </View>
          </View>

          {!!post.caption && <Text className="text-sm leading-5 text-foose-text">{post.caption}</Text>}

          {!!post.tags?.length && (
            <View className="flex-row flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Pressable
                  accessibilityRole="button"
                  className="rounded-full bg-accent-light px-2.5 py-1 active:opacity-70"
                  key={tag}
                  onPress={() => router.push(`/browse?q=${encodeURIComponent(`#${tag}`)}`)}
                >
                  <Text className="text-xs font-bold text-accent">#{tag}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  )
}
