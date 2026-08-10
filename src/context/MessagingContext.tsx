import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { io, type Socket } from 'socket.io-client'
import { getSocketBaseUrl } from '../config/env'
import { useAuth } from '../hooks/useAuth'
import { apiGet, apiPut, getStoredTokens } from '../lib/api'
import type { ChatConversation, ChatMessage, Notification, User } from '../types/api'
import { getErrorMessage } from '../utils/errorMessage'
import { idValue } from '../utils/format'
import {
  MessagingContext,
  type MessagesReadEvent,
  type RealtimeMessageEvent,
  type SendSocketMessageAck,
  type SendSocketMessagePayload,
} from './messaging-context'

type NotificationReadEvent = {
  all?: boolean
  notification?: Notification
  notificationId?: string
}

function participantForMessage(message: ChatMessage, userId: string) {
  return idValue(message.senderId) === userId ? message.receiverId : message.senderId
}

function upsertConversationFromMessage(conversations: ChatConversation[], event: RealtimeMessageEvent, userId: string) {
  const message = event.message
  const incoming = Boolean(userId && idValue(message.receiverId) === userId && idValue(message.senderId) !== userId)
  const participant = participantForMessage(message, userId) as User | string | undefined
  const index = conversations.findIndex((conversation) => conversation.conversationId === event.conversationId)

  if (index === -1) {
    return [
      {
        conversationId: event.conversationId,
        latestMessage: message,
        listing: message.listingId,
        participant,
        unreadCount: incoming ? 1 : 0,
        unreadReactionCount: 0,
      },
      ...conversations,
    ]
  }

  const next = [...conversations]
  const current = next[index]
  next[index] = {
    ...current,
    latestMessage: message,
    listing: message.listingId || current.listing,
    participant: current.participant || participant,
    unreadCount: incoming ? current.unreadCount + 1 : current.unreadCount,
  }

  // Newest conversation floats to the top of the inbox.
  return [next[index], ...next.filter((_, itemIndex) => itemIndex !== index)]
}

function upsertNotification(notifications: Notification[], notification: Notification) {
  // Chat already surfaces in the inbox list; a duplicate system row would double-count it.
  if (notification.type === 'chat') return notifications

  const index = notifications.findIndex((item) => item._id === notification._id)
  if (index === -1) return [notification, ...notifications]

  const next = [...notifications]
  next[index] = notification
  return next
}

/**
 * Port of `frontend/src/context/MessagingContext.tsx`. Socket.IO authenticates with the access
 * token (`backend/src/config/socket.js`); unverified accounts still get the notification room but
 * the server refuses to join them to chat, so chat listeners are only attached when verified.
 */
export function MessagingProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth()
  const userId = user?._id || ''
  const emailVerified = Boolean(user?.isEmailVerified)
  const [connected, setConnected] = useState(false)
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [conversationsError, setConversationsError] = useState('')
  const [conversationsLoading, setConversationsLoading] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [messageEvent, setMessageEvent] = useState<RealtimeMessageEvent | null>(null)
  const [messagesReadEvent, setMessagesReadEvent] = useState<MessagesReadEvent | null>(null)
  const socketRef = useRef<Socket | null>(null)

  const refreshConversations = useCallback(async () => {
    if (!userId || !emailVerified) {
      setConversations([])
      return
    }

    setConversationsLoading(true)
    setConversationsError('')
    try {
      const data = await apiGet<{ conversations: ChatConversation[] }>('/chat?page=1&limit=40')
      setConversations(data.conversations || [])
    } catch (requestError) {
      setConversationsError(getErrorMessage(requestError, 'Unable to load conversations'))
    } finally {
      setConversationsLoading(false)
    }
  }, [emailVerified, userId])

  const refreshNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([])
      return
    }

    try {
      const data = await apiGet<{ notifications: Notification[] }>('/notifications?limit=40')
      setNotifications((data.notifications || []).filter((notification) => notification.type !== 'chat'))
    } catch {
      // Notification badges are ambient; a failed poll must not surface an error state.
    }
  }, [userId])

  useEffect(() => {
    if (status !== 'authenticated') return
    // Deferred so the effect never sets state synchronously and cascades a second render pass.
    queueMicrotask(() => {
      void refreshConversations()
      void refreshNotifications()
    })
  }, [refreshConversations, refreshNotifications, status])

  useEffect(() => {
    if (status !== 'authenticated' || !userId) {
      socketRef.current?.disconnect()
      socketRef.current = null
      // Deferred so the effect never sets state synchronously and cascades a second render pass.
      queueMicrotask(() => setConnected(false))
      return
    }

    const token = getStoredTokens()?.accessToken
    if (!token) return

    const nextSocket = io(getSocketBaseUrl(), {
      auth: { token },
      transports: ['websocket'],
    })

    function handleNewMessage(event: RealtimeMessageEvent) {
      if (!event?.conversationId || !event.message) return
      setMessageEvent({ ...event })
      setConversations((current) => upsertConversationFromMessage(current, event, userId))
    }

    function handleMessagesRead(event: MessagesReadEvent) {
      setMessagesReadEvent({ ...event })
      if (event.readBy !== userId) return
      setConversations((current) =>
        current.map((conversation) =>
          conversation.conversationId === event.conversationId ? { ...conversation, unreadCount: 0 } : conversation,
        ),
      )
    }

    function handleNotification(notification: Notification) {
      if (notification.type === 'chat') return
      setNotifications((current) => upsertNotification(current, notification))
    }

    function handleNotificationRead(event: NotificationReadEvent) {
      if (event.all) {
        setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })))
        return
      }
      if (event.notification) {
        setNotifications((current) => upsertNotification(current, event.notification as Notification))
        return
      }
      if (event.notificationId) {
        setNotifications((current) =>
          current.map((notification) =>
            notification._id === event.notificationId ? { ...notification, isRead: true } : notification,
          ),
        )
      }
    }

    nextSocket.on('connect', () => setConnected(true))
    nextSocket.on('disconnect', () => setConnected(false))
    if (emailVerified) {
      nextSocket.on('new-message', handleNewMessage)
      nextSocket.on('message-confirmed', handleNewMessage)
      nextSocket.on('messages-read', handleMessagesRead)
    }
    nextSocket.on('notification', handleNotification)
    nextSocket.on('new-notification', handleNotification)
    nextSocket.on('notification-read', handleNotificationRead)
    socketRef.current = nextSocket

    return () => {
      nextSocket.removeAllListeners()
      nextSocket.disconnect()
      setConnected(false)
      if (socketRef.current === nextSocket) socketRef.current = null
    }
  }, [emailVerified, status, userId])

  const joinConversation = useCallback((conversationId: string) => {
    if (!conversationId) return
    socketRef.current?.emit('join_conversation', { conversationId })
  }, [])

  const markConversationRead = useCallback((conversationId: string) => {
    if (!conversationId) return
    socketRef.current?.emit('mark-read', { conversationId })
    setConversations((current) =>
      current.map((conversation) =>
        conversation.conversationId === conversationId ? { ...conversation, unreadCount: 0 } : conversation,
      ),
    )
  }, [])

  const sendSocketMessage = useCallback(
    (payload: SendSocketMessagePayload) =>
      new Promise<SendSocketMessageAck>((resolve) => {
        const socket = socketRef.current
        if (!socket?.connected) {
          resolve({ error: 'Realtime connection is unavailable', success: false })
          return
        }
        socket.emit('send-message', payload, (ack: SendSocketMessageAck) => resolve(ack))
      }),
    [],
  )

  const markNotificationRead = useCallback(async (notificationId: string) => {
    setNotifications((current) =>
      current.map((notification) => (notification._id === notificationId ? { ...notification, isRead: true } : notification)),
    )
    await apiPut(`/notifications/${encodeURIComponent(notificationId)}/read`).catch(() => undefined)
  }, [])

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })))
    await apiPut('/notifications/read-all').catch(() => undefined)
  }, [])

  const value = useMemo(
    () => ({
      connected,
      conversations,
      conversationsError,
      conversationsLoading,
      joinConversation,
      markAllNotificationsRead,
      markConversationRead,
      markNotificationRead,
      messageEvent,
      messagesReadEvent,
      notifications,
      refreshConversations,
      refreshNotifications,
      sendSocketMessage: connected ? sendSocketMessage : null,
      unreadMessageCount: conversations.reduce((sum, conversation) => sum + (conversation.unreadCount || 0), 0),
      unreadNotificationCount: notifications.filter((notification) => !notification.isRead).length,
    }),
    [
      connected,
      conversations,
      conversationsError,
      conversationsLoading,
      joinConversation,
      markAllNotificationsRead,
      markConversationRead,
      markNotificationRead,
      messageEvent,
      messagesReadEvent,
      notifications,
      refreshConversations,
      refreshNotifications,
      sendSocketMessage,
    ],
  )

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>
}
