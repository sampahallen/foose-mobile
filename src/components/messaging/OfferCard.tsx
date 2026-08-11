import { Image } from 'expo-image'
import { useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import { useThemeColors } from '../../hooks/useThemeColors'
import type { Bargain, BargainAction, ChatMessage, Listing } from '../../types/api'
import { formatMoney, formatRelativeTime, idValue, parseGhsToPesewas } from '../../utils/format'
import { Button } from '../ui/Button'
import type { ThreadMessage } from './MessageBubble'

const STATUS_LABELS: Record<Bargain['status'], string> = {
  accepted: 'Accepted',
  awaiting_buyer: 'Waiting on buyer',
  awaiting_seller: 'Waiting on seller',
  cancelled: 'Withdrawn',
  closed: 'Closed',
  consumed: 'Used at checkout',
  declined: 'Declined',
}

const STATUS_CLASSES: Record<Bargain['status'], string> = {
  accepted: 'bg-foose-success-bg text-foose-success',
  awaiting_buyer: 'bg-foose-surface-high text-foose-muted',
  awaiting_seller: 'bg-foose-surface-high text-foose-muted',
  cancelled: 'bg-foose-surface-high text-foose-muted',
  closed: 'bg-foose-surface-high text-foose-muted',
  consumed: 'bg-foose-success-bg text-foose-success',
  declined: 'bg-foose-danger-bg text-foose-danger',
}

function listingOf(value: Listing | string | undefined) {
  return value && typeof value === 'object' ? value : undefined
}

function summaryFor(action: ChatMessage['offer'], mine: boolean) {
  const who = mine ? 'You' : 'They'
  switch (action?.action) {
    case 'open':
      return `${who} offered`
    case 'counter':
      return `${who} countered`
    case 'accept':
      return `${who} accepted`
    case 'decline':
      return `${who} declined`
    case 'cancel':
      return `${who} withdrew`
    default:
      return 'Bargain closed'
  }
}

/**
 * One negotiation round inside the thread. The amount comes from the message's
 * own snapshot; live state (whose turn, which buttons) comes from the bargain.
 */
export function OfferCard({
  bargain,
  busy = false,
  currentUserId,
  message,
  interactive = false,
  onAction,
}: {
  bargain?: Bargain
  busy?: boolean
  currentUserId?: string
  interactive?: boolean
  message: ThreadMessage
  onAction?: (bargainId: string, action: BargainAction, amount?: number) => void
}) {
  const colors = useThemeColors()
  const [counterOpen, setCounterOpen] = useState(false)
  const [counterValue, setCounterValue] = useState('')
  const [counterError, setCounterError] = useState('')

  const offer = message.offer
  const listing = listingOf(message.listingId) || listingOf(bargain?.listingId)
  const currency = bargain?.currency || listing?.currency || 'GHS'
  const listPrice = bargain?.listPriceAtOpen ?? listing?.price
  const bargainId = typeof message.bargainId === 'string' ? message.bargainId : message.bargainId?._id

  if (offer?.actor === 'system') {
    return (
      <View className="items-center py-1">
        <Text className="rounded-full bg-foose-surface-high px-3 py-1.5 text-center text-[11px] font-bold text-foose-muted">
          {message.content}
        </Text>
      </View>
    )
  }

  const mine = idValue(message.senderId) === currentUserId
  const allowed = (interactive && bargainId && onAction ? bargain?.allowedActions : []) || []
  const settled = bargain ? bargain.status !== 'awaiting_buyer' && bargain.status !== 'awaiting_seller' : false

  function act(action: BargainAction, amount?: number) {
    if (!bargainId || !onAction) return
    setCounterOpen(false)
    setCounterError('')
    onAction(bargainId, action, amount)
  }

  function submitCounter() {
    const amount = parseGhsToPesewas(counterValue)
    if (amount === null || amount <= 0) {
      setCounterError('Enter an amount like 70 or 70.50')
      return
    }
    if (listPrice !== undefined && amount >= listPrice) {
      setCounterError(`Offer below the listed ${formatMoney(listPrice, currency)}`)
      return
    }
    setCounterValue('')
    act('counter', amount)
  }

  return (
    <View className={`w-[86%] gap-3 rounded-2xl border-2 border-accent/25 bg-foose-surface p-3 ${mine ? 'self-end' : 'self-start'}`}>
      <View className="flex-row items-center justify-between gap-2">
        <Text className="text-[11px] font-black uppercase tracking-wide text-accent">Offer</Text>
        {!!bargain && (
          <Text className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_CLASSES[bargain.status]}`}>
            {STATUS_LABELS[bargain.status]}
          </Text>
        )}
      </View>

      {!!listing && (
        <View className="flex-row items-center gap-3 rounded-xl bg-foose-surface-low p-2">
          {listing.images?.[0] ? (
            <Image
              accessibilityIgnoresInvertColors
              className="rounded-lg"
              contentFit="cover"
              source={{ uri: listing.images[0] }}
              style={{ height: 44, width: 44 }}
            />
          ) : (
            <View className="size-11 rounded-lg bg-foose-surface-mid" />
          )}
          <Text className="flex-1 text-xs font-black text-foose-text" numberOfLines={1}>
            {listing.title}
          </Text>
        </View>
      )}

      <View>
        <Text className="text-[11px] font-semibold text-foose-muted">{summaryFor(offer, mine)}</Text>
        {offer?.amount === undefined ? (
          <Text className="text-sm font-semibold text-foose-text">{message.content}</Text>
        ) : (
          <View className="flex-row flex-wrap items-baseline gap-2">
            {listPrice !== undefined && listPrice !== offer.amount && (
              <Text className="text-xs font-semibold text-foose-muted line-through">
                {formatMoney(listPrice, currency)}
              </Text>
            )}
            <Text className="text-xl font-black text-foose-text">{formatMoney(offer.amount, currency)}</Text>
          </View>
        )}
      </View>

      {bargain?.status === 'accepted' && (
        <Text className="rounded-lg bg-foose-success-bg px-3 py-2 text-[11px] font-semibold text-foose-success">
          {bargain.viewerRole === 'seller'
            ? 'This price is locked for this buyer until they check out.'
            : 'This price is yours until you check out. Others can still buy at the listed price.'}
        </Text>
      )}
      {bargain?.isFinalRound && !settled && (
        <Text className="rounded-lg bg-foose-surface-high px-3 py-2 text-[11px] font-semibold text-foose-muted">
          Final round — accept or decline, no more counters.
        </Text>
      )}

      {!!allowed.length && !counterOpen && (
        <View className="gap-2">
          {allowed.includes('accept') && (
            <Button
              disabled={busy}
              label={offer?.amount === undefined ? 'Accept' : `Accept ${formatMoney(offer.amount, currency)}`}
              onPress={() => act('accept')}
              size="sm"
            />
          )}
          <View className="flex-row gap-2">
            {allowed.includes('counter') && (
              <View className="flex-1">
                <Button disabled={busy} label="Counter" onPress={() => setCounterOpen(true)} size="sm" variant="secondary" />
              </View>
            )}
            {allowed.includes('decline') && (
              <View className="flex-1">
                <Button disabled={busy} label="Decline" onPress={() => act('decline')} size="sm" variant="danger" />
              </View>
            )}
            {allowed.includes('cancel') && !allowed.includes('decline') && (
              <View className="flex-1">
                <Button disabled={busy} label="Drop bargain" onPress={() => act('cancel')} size="sm" variant="danger" />
              </View>
            )}
          </View>
        </View>
      )}

      {counterOpen && (
        <View className="gap-2">
          <TextInput
            autoFocus
            className="h-11 rounded-xl border border-foose-border bg-foose-surface-low px-3 text-sm text-foose-text"
            keyboardType="decimal-pad"
            onChangeText={(next) => {
              setCounterValue(next)
              if (counterError) setCounterError('')
            }}
            placeholder={`Your price (${currency})`}
            placeholderTextColor={colors.faint}
            value={counterValue}
          />
          {!!counterError && <Text className="text-[11px] font-semibold text-foose-danger">{counterError}</Text>}
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button disabled={busy} label="Send counter" onPress={submitCounter} size="sm" />
            </View>
            <View className="flex-1">
              <Button
                disabled={busy}
                label="Cancel"
                onPress={() => {
                  setCounterOpen(false)
                  setCounterError('')
                }}
                size="sm"
                variant="ghost"
              />
            </View>
          </View>
        </View>
      )}

      <Text className="text-[10px] text-foose-faint">{formatRelativeTime(message.createdAt)}</Text>
    </View>
  )
}
