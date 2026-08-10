import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { ListSkeleton } from '../../components/feedback/Skeleton'
import { StatePanel } from '../../components/feedback/StatePanel'
import { Screen } from '../../components/layout/Screen'
import { TopBar } from '../../components/layout/TopBar'
import { useAuth } from '../../hooks/useAuth'
import { useMessaging } from '../../hooks/useMessaging'
import { useThemeColors } from '../../hooks/useThemeColors'
import { apiGet, apiPost } from '../../lib/api'
import type { ChatMessage, User } from '../../types/api'
import { getErrorMessage } from '../../utils/errorMessage'
import { formatRelativeTime, idValue } from '../../utils/format'

type ConversationPage = {
  contactVisible?: boolean
  messages: ChatMessage[]
  page: number
  pages: number
  participant?: User | null
  total: number
}

type PendingMessage = ChatMessage & { failed?: boolean; pending?: boolean }

/**
 * Threads render newest-first in an inverted list, which matches how the backend already sorts
 * `/chat/:conversationId` — no reversing, and pagination appends older pages at the visual top.
 */
export default function ConversationScreen() {
  const { conversationId, receiverId, listingId } = useLocalSearchParams<{
    conversationId: string
    listingId?: string
    receiverId?: string
  }>()
  const { user } = useAuth()
  const colors = useThemeColors()
  const messaging = useMessaging()
  // `new` is the placeholder segment used when a listing starts a thread that does not exist yet.
  const existingConversation = conversationId && conversationId !== 'new' ? conversationId : ''
  const [activeConversationId, setActiveConversationId] = useState(existingConversation)
  const [messages, setMessages] = useState<PendingMessage[]>([])
  const [participant, setParticipant] = useState<User | null>(null)
  const [loading, setLoading] = useState(Boolean(existingConversation))
  const [error, setError] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const clientMessageIdRef = useRef(0)

  const loadPage = useCallback(
    async (nextPage: number) => {
      if (!activeConversationId) return
      setLoading(nextPage === 1)
      try {
        const data = await apiGet<ConversationPage>(
          `/chat/${encodeURIComponent(activeConversationId)}?page=${nextPage}&limit=30`,
        )
        setPages(data.pages || 1)
        setPage(data.page || nextPage)
        setParticipant(data.participant || null)
        setMessages((current) => {
          if (nextPage === 1) return data.messages
          const seen = new Set(current.map((message) => message._id))
          return [...current, ...data.messages.filter((message) => !seen.has(message._id))]
        })
      } catch (requestError) {
        setError(getErrorMessage(requestError, 'Unable to load this conversation'))
      } finally {
        setLoading(false)
      }
    },
    [activeConversationId],
  )

  useEffect(() => {
    if (!activeConversationId) return
    // Deferred so the effect never sets state synchronously and cascades a second render pass.
    queueMicrotask(() => void loadPage(1))
    messaging.joinConversation(activeConversationId)
    messaging.markConversationRead(activeConversationId)
    // `messaging` identity changes on every unread-count update; the conversation is the real dep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId])

  // Live messages arrive through the socket; drop the optimistic copy once the server echo lands.
  useEffect(() => {
    const event = messaging.messageEvent
    if (!event || event.conversationId !== activeConversationId) return
    // Deferred so the effect never sets state synchronously and cascades a second render pass.
    queueMicrotask(() => {
      setMessages((current) => {
        const withoutOptimistic = current.filter(
          (message) => message._id !== event.message._id && message._id !== event.clientMessageId,
        )
        return [event.message, ...withoutOptimistic]
      })
      messaging.markConversationRead(activeConversationId)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messaging.messageEvent])

  const title = useMemo(() => participant?.name || participant?.username || 'Conversation', [participant])

  async function send() {
    const content = draft.trim()
    if (!content || sending) return

    clientMessageIdRef.current += 1
    const clientMessageId = `pending-${clientMessageIdRef.current}`
    const optimistic: PendingMessage = {
      _id: clientMessageId,
      content,
      createdAt: new Date().toISOString(),
      pending: true,
      senderId: user?._id,
    }

    setMessages((current) => [optimistic, ...current])
    setDraft('')
    setSending(true)

    try {
      // Socket delivery keeps both sides in sync instantly; REST is the fallback when it is down.
      if (messaging.sendSocketMessage) {
        const ack = await messaging.sendSocketMessage({
          clientMessageId,
          content,
          conversationId: activeConversationId || undefined,
          listingId: typeof listingId === 'string' ? listingId : undefined,
          receiverId: typeof receiverId === 'string' ? receiverId : undefined,
        })
        if (!ack.success) throw new Error(ack.error || 'Message failed to send')
        if (ack.conversationId && !activeConversationId) setActiveConversationId(ack.conversationId)
        return
      }

      const data = await apiPost<{ conversationId: string; message: ChatMessage }>('/chat', {
        content,
        conversationId: activeConversationId || undefined,
        listingId: typeof listingId === 'string' ? listingId : undefined,
        receiverId: typeof receiverId === 'string' ? receiverId : undefined,
      })
      setMessages((current) => [data.message, ...current.filter((message) => message._id !== clientMessageId)])
      if (!activeConversationId) setActiveConversationId(data.conversationId)
      void messaging.refreshConversations()
    } catch (requestError) {
      setMessages((current) =>
        current.map((message) => (message._id === clientMessageId ? { ...message, failed: true, pending: false } : message)),
      )
      setError(getErrorMessage(requestError, 'Message failed to send'))
    } finally {
      setSending(false)
    }
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar showBack showCart={false} showSearch={false} title={title} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
        keyboardVerticalOffset={8}
      >
        {loading ? (
          <View className="p-4">
            <ListSkeleton />
          </View>
        ) : (
          <FlatList
            contentContainerClassName="gap-2 p-4"
            data={messages}
            inverted
            keyExtractor={(message) => message._id}
            ListEmptyComponent={
              <View className="-scale-y-100 py-10">
                <StatePanel
                  body={error || 'Say hello — the seller is notified straight away.'}
                  title={error ? 'Conversation unavailable' : 'No messages yet'}
                  tone={error ? 'error' : 'empty'}
                />
              </View>
            }
            ListFooterComponent={page < pages ? <ActivityIndicator className="py-4" color={colors.accent} /> : null}
            onEndReached={() => {
              if (page < pages) void loadPage(page + 1)
            }}
            onEndReachedThreshold={0.4}
            renderItem={({ item }) => {
              const mine = idValue(item.senderId) === user?._id
              return (
                <View className={`max-w-[82%] gap-1 ${mine ? 'self-end' : 'self-start'}`}>
                  {item.attachments?.map((attachment) => (
                    <Image
                      accessibilityIgnoresInvertColors
                      className="rounded-xl"
                      contentFit="cover"
                      key={attachment.url}
                      source={{ uri: attachment.url }}
                      style={{ height: 180, width: 180 }}
                    />
                  ))}
                  {!!item.content && (
                    <View
                      className={`rounded-2xl px-3.5 py-2.5 ${
                        mine ? 'bg-accent' : 'bg-foose-surface border border-foose-border'
                      } ${item.failed ? 'opacity-60' : ''}`}
                    >
                      <Text className={`text-sm ${mine ? 'text-white' : 'text-foose-text'}`}>{item.content}</Text>
                    </View>
                  )}
                  <Text className={`text-[10px] text-foose-faint ${mine ? 'text-right' : ''}`}>
                    {item.failed ? 'Not delivered' : item.pending ? 'Sending…' : formatRelativeTime(item.createdAt)}
                  </Text>
                </View>
              )
            }}
          />
        )}

        <View className="flex-row items-end gap-2 border-t border-foose-border bg-foose-surface p-3">
          <TextInput
            className="max-h-28 min-h-11 flex-1 rounded-2xl border border-foose-border bg-foose-surface-low px-3.5 py-2.5 text-sm text-foose-text"
            multiline
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor={colors.faint}
            value={draft}
          />
          <Pressable
            accessibilityLabel="Send message"
            accessibilityRole="button"
            className={`size-11 items-center justify-center rounded-full ${draft.trim() ? 'bg-accent' : 'bg-foose-surface-mid'}`}
            disabled={!draft.trim() || sending}
            onPress={() => void send()}
          >
            <Ionicons color={draft.trim() ? '#ffffff' : colors.faint} name="send" size={18} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  )
}
