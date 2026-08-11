import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost } from '../lib/api'
import type { Bargain, BargainAction, BargainResponse, ChatMessage } from '../types/api'
import { getErrorMessage } from '../utils/errorMessage'
import { useMessaging } from './useMessaging'

function bargainIdOf(message: ChatMessage) {
  const value = message.bargainId
  if (!value) return ''
  return typeof value === 'string' ? value : value._id
}

function listingIdOf(bargain: Bargain) {
  const value = bargain.listingId
  if (!value) return ''
  return typeof value === 'string' ? value : value._id
}

/**
 * Live bargain state for the offer cards in a thread. Offer messages arrive on
 * the normal chat stream carrying an immutable snapshot of their round; this
 * tracks the current state of each negotiation so only the newest card is
 * interactive and both sides update the moment `bargain-updated` lands.
 */
export function useBargain(messages: ChatMessage[]) {
  const { bargainEvent } = useMessaging()
  const [bargains, setBargains] = useState<Record<string, Bargain>>({})
  const [busyId, setBusyId] = useState('')
  const [actionError, setActionError] = useState('')

  const bargainIds = useMemo(() => {
    const ids = new Set<string>()
    for (const message of messages) {
      const id = bargainIdOf(message)
      if (id) ids.add(id)
    }
    return [...ids].sort().join(',')
  }, [messages])

  // Only the last offer message of each bargain gets buttons.
  const latestOfferMessageIds = useMemo(() => {
    const latest = new Map<string, string>()
    for (const message of messages) {
      const id = bargainIdOf(message)
      // The thread renders newest-first, so the first hit is the latest round.
      if (id && message.type === 'offer' && !latest.has(id)) latest.set(id, message._id)
    }
    return new Set(latest.values())
  }, [messages])

  const mergeBargain = useCallback((bargain: Bargain) => {
    setBargains((current) => ({ ...current, [bargain._id]: bargain }))
  }, [])

  useEffect(() => {
    const ids = bargainIds ? bargainIds.split(',') : []
    if (!ids.length) return undefined

    let active = true
    // Deferred so the effect never sets state synchronously and cascades a second render pass.
    queueMicrotask(() => {
      void Promise.all(
        ids.map((id) =>
          apiGet<{ bargain: Bargain }>(`/bargains/${encodeURIComponent(id)}`)
            .then((data) => data.bargain)
            .catch(() => null),
        ),
      ).then((loaded) => {
        if (!active) return
        const next: Record<string, Bargain> = {}
        for (const bargain of loaded) {
          if (bargain) next[bargain._id] = bargain
        }
        setBargains((current) => ({ ...current, ...next }))
      })
    })

    return () => {
      active = false
    }
  }, [bargainIds])

  useEffect(() => {
    if (!bargainEvent?.bargain) return
    // Deferred so the effect never sets state synchronously and cascades a second render pass.
    queueMicrotask(() => mergeBargain(bargainEvent.bargain))
  }, [bargainEvent, mergeBargain])

  const act = useCallback(
    async (bargainId: string, action: BargainAction, amount?: number) => {
      if (!bargainId) return null
      setBusyId(bargainId)
      setActionError('')
      try {
        const result = await apiPost<BargainResponse>(
          `/bargains/${encodeURIComponent(bargainId)}/${action}`,
          action === 'counter' ? { amount } : {},
        )
        mergeBargain(result.bargain)
        return result
      } catch (error) {
        setActionError(getErrorMessage(error, 'Bargain could not be updated'))
        return null
      } finally {
        setBusyId('')
      }
    },
    [mergeBargain],
  )

  return {
    act,
    actionError,
    bargains,
    busyId,
    clearActionError: useCallback(() => setActionError(''), []),
    isLatestOfferMessage: useCallback(
      (messageId: string) => latestOfferMessageIds.has(messageId),
      [latestOfferMessageIds],
    ),
  }
}

/**
 * The buyer's own accepted, unspent bargains keyed by listing. Display only —
 * the server resolves the real price when the order is placed.
 */
export function useAcceptedBargainPrices(enabled = true) {
  const [prices, setPrices] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!enabled) return undefined

    let active = true
    // Deferred so the effect never sets state synchronously and cascades a second render pass.
    queueMicrotask(() => {
      void apiGet<{ bargains: Bargain[] }>('/bargains?role=buyer&status=accepted&limit=100')
        .then((data) => {
          if (!active) return
          const next: Record<string, number> = {}
          for (const bargain of data.bargains || []) {
            const listingId = listingIdOf(bargain)
            if (listingId && typeof bargain.agreedPrice === 'number') next[listingId] = bargain.agreedPrice
          }
          setPrices(next)
        })
        .catch(() => undefined)
    })

    return () => {
      active = false
    }
  }, [enabled])

  return prices
}
