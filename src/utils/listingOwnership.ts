import type { Listing, User } from '../types/api'
import { getShop } from './format'

/** Sellers should not see their own stock in discovery feeds (mirrors the web app). */
export function withoutOwnListings(listings: Listing[], user: User | null | undefined) {
  if (!user?._id) return listings
  return listings.filter((listing) => {
    const owner = getShop(listing)?.ownerId
    const ownerId = typeof owner === 'string' ? owner : owner?._id
    return ownerId !== user._id
  })
}

export function isOwnListing(listing: Listing, user: User | null | undefined) {
  if (!user?._id) return false
  const owner = getShop(listing)?.ownerId
  const ownerId = typeof owner === 'string' ? owner : owner?._id
  return ownerId === user._id
}
