import { Ionicons } from '@expo/vector-icons'
import { router, usePathname } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import { useThemeColors } from '../../hooks/useThemeColors'
import { Avatar } from '../ui/Avatar'

/**
 * Condensed version of the web `TopNav`: brand/title on the left, search + cart on the right.
 * Navigation itself lives in the bottom tabs, matching the site's mobile breakpoint.
 */
export function TopBar({
  action,
  showBack = false,
  showCart = true,
  showProfile = false,
  showSearch = true,
  subtitle,
  title,
}: {
  action?: ReactNode
  showBack?: boolean
  showCart?: boolean
  showProfile?: boolean
  showSearch?: boolean
  subtitle?: string
  title: string
}) {
  const colors = useThemeColors()
  const cart = useCart()
  const { user } = useAuth()
  const pathname = usePathname()

  return (
    <View className="flex-row items-center gap-3 border-b border-foose-border bg-foose-surface px-4 py-3">
      {showBack && (
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          className="-ml-1 size-9 items-center justify-center rounded-full active:bg-foose-surface-mid"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        >
          <Ionicons color={colors.text} name="chevron-back" size={22} />
        </Pressable>
      )}
      <View className="min-w-0 flex-1">
        <Text className="text-lg font-bold text-foose-text" numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text className="text-xs text-foose-muted" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {action}
      {showSearch && pathname !== '/search' && (
        <Pressable
          accessibilityLabel="Search"
          accessibilityRole="button"
          className="size-9 items-center justify-center rounded-full active:bg-foose-surface-mid"
          onPress={() => router.push('/search')}
        >
          <Ionicons color={colors.text} name="search" size={20} />
        </Pressable>
      )}
      {showCart && (
        <Pressable
          accessibilityLabel={cart.count ? `Cart, ${cart.count} items` : 'Cart'}
          accessibilityRole="button"
          className="size-9 items-center justify-center rounded-full active:bg-foose-surface-mid"
          onPress={() => router.push('/cart')}
        >
          <Ionicons color={colors.text} name="bag-outline" size={20} />
          {cart.count > 0 && (
            <View className="absolute -right-0.5 -top-0.5 min-w-4 items-center justify-center rounded-full bg-accent px-1">
              <Text className="text-[10px] font-black leading-4 text-white">{cart.count > 99 ? '99+' : cart.count}</Text>
            </View>
          )}
        </Pressable>
      )}
      {showProfile && (
        <Pressable
          accessibilityLabel={user ? 'Your profile' : 'Sign in'}
          accessibilityRole="button"
          className="size-9 items-center justify-center rounded-full active:bg-foose-surface-mid"
          onPress={() => router.push(user ? '/profile' : '/login')}
        >
          {user ? (
            <Avatar name={user.name} size={28} uri={user.profilePhoto} />
          ) : (
            <Ionicons color={colors.text} name="person-circle-outline" size={24} />
          )}
        </Pressable>
      )}
    </View>
  )
}
