import { router } from 'expo-router'
import { useState } from 'react'
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native'
import { AuthRequired } from '../../components/auth/AuthRequired'
import { InlineNotice } from '../../components/feedback/InlineNotice'
import { ListSkeleton } from '../../components/feedback/Skeleton'
import { StatePanel } from '../../components/feedback/StatePanel'
import { Screen } from '../../components/layout/Screen'
import { TopBar } from '../../components/layout/TopBar'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Chip } from '../../components/ui/Chip'
import { useAuth } from '../../hooks/useAuth'
import { useMessaging } from '../../hooks/useMessaging'
import { useThemeColors } from '../../hooks/useThemeColors'
import { asUser, displayName, formatRelativeTime } from '../../utils/format'

type InboxSection = 'chats' | 'system'

function InboxContent() {
  const { user } = useAuth()
  const colors = useThemeColors()
  const messaging = useMessaging()
  const [section, setSection] = useState<InboxSection>('chats')

  // Messaging is gated on a verified email server-side; say so rather than showing an empty inbox.
  if (!user?.isEmailVerified) {
    return (
      <View className="p-4">
        <InlineNotice title="Verify your email to use chat" tone="warning">
          Foose requires a verified email before you can message sellers. Check your inbox for the verification link.
        </InlineNotice>
      </View>
    )
  }

  return (
    <>
      <View className="flex-row gap-2 border-b border-foose-border bg-foose-surface px-4 py-3">
        <Chip
          active={section === 'chats'}
          label={messaging.unreadMessageCount ? `Chats (${messaging.unreadMessageCount})` : 'Chats'}
          onPress={() => setSection('chats')}
        />
        <Chip
          active={section === 'system'}
          label={messaging.unreadNotificationCount ? `Updates (${messaging.unreadNotificationCount})` : 'Updates'}
          onPress={() => setSection('system')}
        />
        {section === 'system' && messaging.unreadNotificationCount > 0 && (
          <>
            <View className="flex-1" />
            <Button label="Mark all read" onPress={() => void messaging.markAllNotificationsRead()} size="sm" variant="ghost" />
          </>
        )}
      </View>

      {section === 'chats' ? (
        <FlatList
          contentContainerClassName="p-4 pb-10"
          data={messaging.conversations}
          keyExtractor={(conversation) => conversation.conversationId}
          ListEmptyComponent={
            messaging.conversationsLoading ? (
              <ListSkeleton />
            ) : (
              <StatePanel
                action={<Button label="Find something to buy" onPress={() => router.push('/browse')} />}
                body={messaging.conversationsError || 'Message a seller from any listing and the thread appears here.'}
                title={messaging.conversationsError ? 'Conversations could not load' : 'No conversations yet'}
                tone={messaging.conversationsError ? 'error' : 'empty'}
              />
            )
          }
          refreshControl={
            <RefreshControl
              onRefresh={() => void messaging.refreshConversations()}
              refreshing={messaging.conversationsLoading}
              tintColor={colors.accent}
            />
          }
          renderItem={({ item }) => {
            const participant = asUser(item.participant)
            return (
              <Pressable
                accessibilityRole="button"
                className="flex-row items-center gap-3 border-b border-foose-border py-3 active:opacity-80"
                onPress={() => router.push(`/chat/${encodeURIComponent(item.conversationId)}`)}
              >
                <Avatar name={displayName(item.participant)} size={44} uri={participant?.profilePhoto} />
                <View className="min-w-0 flex-1 gap-0.5">
                  <View className="flex-row items-center gap-2">
                    <Text className="min-w-0 flex-1 text-sm font-bold text-foose-text" numberOfLines={1}>
                      {displayName(item.participant)}
                    </Text>
                    <Text className="text-[10px] text-foose-faint">{formatRelativeTime(item.latestMessage?.createdAt)}</Text>
                  </View>
                  <Text
                    className={`text-xs ${item.unreadCount ? 'font-bold text-foose-text' : 'text-foose-muted'}`}
                    numberOfLines={1}
                  >
                    {item.latestMessage?.content || 'Attachment'}
                  </Text>
                </View>
                {item.unreadCount > 0 && (
                  <View className="min-w-5 items-center justify-center rounded-full bg-accent px-1.5 py-0.5">
                    <Text className="text-[10px] font-black text-white">{item.unreadCount > 99 ? '99+' : item.unreadCount}</Text>
                  </View>
                )}
              </Pressable>
            )
          }}
        />
      ) : (
        <FlatList
          contentContainerClassName="gap-2 p-4 pb-10"
          data={messaging.notifications}
          keyExtractor={(notification) => notification._id}
          ListEmptyComponent={
            <StatePanel body="Order, review, and account updates land here." title="No updates yet" tone="empty" />
          }
          refreshControl={
            <RefreshControl onRefresh={() => void messaging.refreshNotifications()} refreshing={false} tintColor={colors.accent} />
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              className={`gap-1 rounded-xl border p-3.5 active:opacity-80 ${
                item.isRead ? 'border-foose-border bg-foose-surface' : 'border-accent bg-accent-light'
              }`}
              onPress={() => void messaging.markNotificationRead(item._id)}
            >
              <Text className="text-sm font-bold text-foose-text">{item.title}</Text>
              {!!item.body && <Text className="text-xs text-foose-muted">{item.body}</Text>}
              <Text className="text-[10px] text-foose-faint">{formatRelativeTime(item.createdAt)}</Text>
            </Pressable>
          )}
        />
      )}
    </>
  )
}

export default function InboxScreen() {
  return (
    <Screen>
      <TopBar showCart={false} showProfile showSearch={false} title="Inbox" />
      <AuthRequired body="Sign in to message sellers and follow your order updates." title="Your inbox">
        <InboxContent />
      </AuthRequired>
    </Screen>
  )
}
