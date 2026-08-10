import type { Listing, Shop, User } from '../types/api'

/** All backend money values are integers in pesewas — divide before display, never before math. */
export function formatMoney(value = 0, currency = 'GHS') {
  const majorValue = value / 100
  return new Intl.NumberFormat('en-GH', {
    currency,
    currencyDisplay: 'code',
    style: 'currency',
  }).format(majorValue)
}

export function formatDate(value?: string) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en-GH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatDateTime(value?: string) {
  if (!value) return 'Not set'
  return new Intl.DateTimeFormat('en-GH', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatRelativeTime(value?: string) {
  if (!value) return ''
  const elapsed = Date.now() - new Date(value).getTime()
  const minutes = Math.round(elapsed / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d`
  return formatDate(value)
}

export function getListingImage(listing: Listing) {
  return listing.images?.find(Boolean)
}

export function getShop(listing: Listing): Shop | undefined {
  return typeof listing.shopId === 'object' ? listing.shopId : undefined
}

export function getShopName(listing: Listing) {
  return getShop(listing)?.shopName || 'Independent seller'
}

export function listingMeta(listing: Listing) {
  return [listing.category, listing.subcategory, listing.size, listing.gender].filter(Boolean).join(' · ') || listing.type
}

export function initials(name?: string) {
  return (name || 'User')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/** Populated references arrive either as an id string or the embedded document. */
export function idValue(value: User | Shop | Listing | string | null | undefined): string {
  if (!value) return ''
  return typeof value === 'string' ? value : value._id
}

export function asUser(value: User | string | null | undefined): User | null {
  return value && typeof value === 'object' ? value : null
}

export function displayName(value: User | string | null | undefined) {
  const user = asUser(value)
  return user?.name || user?.username || 'Foose member'
}
