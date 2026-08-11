import { Image } from 'expo-image'
import { Text, View } from 'react-native'
import type { ChatMessage } from '../../types/api'
import { formatRelativeTime, idValue } from '../../utils/format'

export type ThreadMessage = ChatMessage & { failed?: boolean; pending?: boolean }

/** A plain text/attachment message. Offer rounds render through OfferCard instead. */
export function MessageBubble({ currentUserId, message }: { currentUserId?: string; message: ThreadMessage }) {
  const mine = idValue(message.senderId) === currentUserId

  return (
    <View className={`max-w-[82%] gap-1 ${mine ? 'self-end' : 'self-start'}`}>
      {message.attachments?.map((attachment) => (
        <Image
          accessibilityIgnoresInvertColors
          className="rounded-xl"
          contentFit="cover"
          key={attachment.url}
          source={{ uri: attachment.url }}
          style={{ height: 180, width: 180 }}
        />
      ))}
      {!!message.content && (
        <View
          className={`rounded-2xl px-3.5 py-2.5 ${
            mine ? 'bg-accent' : 'bg-foose-surface border border-foose-border'
          } ${message.failed ? 'opacity-60' : ''}`}
        >
          <Text className={`text-sm ${mine ? 'text-white' : 'text-foose-text'}`}>{message.content}</Text>
        </View>
      )}
      <Text className={`text-[10px] text-foose-faint ${mine ? 'text-right' : ''}`}>
        {message.failed ? 'Not delivered' : message.pending ? 'Sending…' : formatRelativeTime(message.createdAt)}
      </Text>
    </View>
  )
}
