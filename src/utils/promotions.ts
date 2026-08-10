import { apiPost } from '../lib/api'

/** Mirrors `frontend/src/utils/promotions.ts` — the backend tags promoted listings `top-pick`. */
export function isActiveTopPick(promotionTags?: string[], promotionExpiresAt?: string) {
  return Boolean(promotionTags?.includes('top-pick') && promotionExpiresAt && new Date(promotionExpiresAt).getTime() > Date.now())
}

export function isActiveEventPromotion(promotionTags?: string[], promotionExpiresAt?: string, status?: string) {
  if (status === 'past' || !promotionExpiresAt || new Date(promotionExpiresAt).getTime() <= Date.now()) return false
  return Boolean(promotionTags?.some((tag) => ['featured', 'home-featured', 'home-banner'].includes(tag)))
}

/**
 * The web app dedupes metrics through `sessionStorage`; a mobile app process is the session, so an
 * in-memory set does the same job and resets when the app is killed.
 */
const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
const recordedMetrics = new Set<string>()

export function recordPromotionMetric(listingId: string, metric: 'impression' | 'click') {
  const dedupeKey = `${metric}:${listingId}`
  if (recordedMetrics.has(dedupeKey)) return
  recordedMetrics.add(dedupeKey)
  void apiPost(`/promotions/listings/${listingId}/metrics`, { metric, sessionId }).catch(() => {
    recordedMetrics.delete(dedupeKey)
  })
}
