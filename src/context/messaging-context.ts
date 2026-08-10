import { createContext } from 'react'
import type { ChatConversation, ChatMessage, Notification } from '../types/api'

export type RealtimeMessageEvent = {
  clientMessageId?: string
  conversationId: string
  message: ChatMessage
}

export type MessagesReadEvent = {
  conversationId: string
  readBy: string
}

export type SendSocketMessagePayload = {
  clientMessageId?: string
  content: string
  conversationId?: string
  listingId?: string
  receiverId?: string
  replyTo?: string
}

export type SendSocketMessageAck = {
  success: boolean
  error?: string
  conversationId?: string
  clientMessageId?: string
  message?: ChatMessage
}

export type MessagingContextValue = {
  connected: boolean
  conversations: ChatConversation[]
  conversationsError: string
  conversationsLoading: boolean
  joinConversation: (conversationId: string) => void
  markConversationRead: (conversationId: string) => void
  markNotificationRead: (notificationId: string) => Promise<void>
  markAllNotificationsRead: () => Promise<void>
  messageEvent: RealtimeMessageEvent | null
  messagesReadEvent: MessagesReadEvent | null
  notifications: Notification[]
  refreshConversations: () => Promise<void>
  refreshNotifications: () => Promise<void>
  sendSocketMessage: ((payload: SendSocketMessagePayload) => Promise<SendSocketMessageAck>) | null
  unreadMessageCount: number
  unreadNotificationCount: number
}

export const MessagingContext = createContext<MessagingContextValue | null>(null)
