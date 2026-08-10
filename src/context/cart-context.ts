import { createContext } from 'react'
import type { Listing } from '../types/api'

export type CartItem = {
  listingId: string
  title: string
  price: number
  currency: string
  quantity: number
  type?: 'retail' | 'wholesale'
  bulkMinQty?: number
  image?: string
  shopId?: string
  shopName: string
  status?: Listing['status']
  sourceEventId?: string
  sourceEventTitle?: string
  availableFrom?: string
  availableUntil?: string
}

export type CartContextValue = {
  addListing: (
    listing: Listing,
    quantity?: number,
    options?: Pick<CartItem, 'availableFrom' | 'availableUntil' | 'sourceEventId' | 'sourceEventTitle'>,
  ) => boolean
  clearCart: () => void
  count: number
  items: CartItem[]
  removeItem: (listingId: string) => void
  subtotal: number
  updateQuantity: (listingId: string, quantity: number) => void
}

export const CartContext = createContext<CartContextValue | null>(null)
