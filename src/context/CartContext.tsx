import AsyncStorage from '@react-native-async-storage/async-storage'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getCartStorageKey } from '../config/env'
import type { Listing } from '../types/api'
import { getListingImage, getShop, getShopName } from '../utils/format'
import { CartContext, type CartItem } from './cart-context'
import { useAuth } from '../hooks/useAuth'

/**
 * Port of `frontend/src/hooks/useCart.ts`. The web version re-reads `localStorage` on every mutation
 * because multiple tabs share it; a mobile app has one cart, so state is held here and mirrored to
 * AsyncStorage in the background.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?._id
  const [items, setItems] = useState<CartItem[]>([])
  const hydratedRef = useRef(false)

  useEffect(() => {
    async function hydrate() {
      try {
        const raw = await AsyncStorage.getItem(getCartStorageKey())
        if (raw) setItems(JSON.parse(raw) as CartItem[])
      } catch {
        await AsyncStorage.removeItem(getCartStorageKey()).catch(() => undefined)
      } finally {
        hydratedRef.current = true
      }
    }

    void hydrate()
  }, [])

  useEffect(() => {
    // Skip the write that would clobber storage with `[]` before hydration finishes.
    if (!hydratedRef.current) return
    void AsyncStorage.setItem(getCartStorageKey(), JSON.stringify(items)).catch(() => undefined)
  }, [items])

  const addListing = useCallback(
    (
      listing: Listing,
      quantity = 1,
      options: Pick<CartItem, 'availableFrom' | 'availableUntil' | 'sourceEventId' | 'sourceEventTitle'> = {},
    ) => {
      const shop = getShop(listing)
      const ownerId = typeof shop?.ownerId === 'string' ? shop.ownerId : shop?.ownerId?._id
      if (userId && ownerId === userId) return false

      const listingType = listing.type || 'retail'
      // Retail listings are single-item; wholesale respects the seller's bulk minimum.
      const nextQuantity = listingType === 'retail' ? 1 : Math.max(quantity, listing.bulkMinQty || 1)
      const nextItem: CartItem = {
        bulkMinQty: listing.bulkMinQty,
        currency: listing.currency || 'GHS',
        image: getListingImage(listing),
        listingId: listing._id,
        price: listing.price,
        quantity: nextQuantity,
        shopId: shop?._id,
        shopName: getShopName(listing),
        status: listing.status,
        ...options,
        title: listing.title,
        type: listingType,
      }

      setItems((current) => {
        const existing = current.find((item) => item.listingId === listing._id)
        if (!existing) return [...current, nextItem]
        return current.map((item) =>
          item.listingId === listing._id
            ? {
                ...item,
                ...options,
                status: listing.status,
                quantity: listingType === 'retail' ? 1 : item.quantity + nextQuantity,
              }
            : item,
        )
      })

      return true
    },
    [userId],
  )

  const updateQuantity = useCallback((listingId: string, quantity: number) => {
    setItems((current) =>
      current
        .map((item) =>
          item.listingId === listingId
            ? { ...item, quantity: item.type === 'wholesale' ? Math.max(quantity, item.bulkMinQty || 1) : 1 }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }, [])

  const removeItem = useCallback((listingId: string) => {
    setItems((current) => current.filter((item) => item.listingId !== listingId))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const value = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return {
      addListing,
      clearCart,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      items,
      removeItem,
      subtotal,
      updateQuantity,
    }
  }, [addListing, clearCart, items, removeItem, updateQuantity])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
