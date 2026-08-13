import { Ionicons } from '@expo/vector-icons'
import { router, usePathname } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import type { ReactNode } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useAuth } from '../../hooks/useAuth'
import { useCart } from '../../hooks/useCart'
import { useThemeColors } from '../../hooks/useThemeColors'
import { Avatar } from '../ui/Avatar'

/**
 * Condensed version of the web `TopNav`'s mobile icon row (`.mobile-nav-actions` in
 * `frontend/src/components/layout/TopNav.tsx`): solid accent bar, white icon buttons, active tab
 * filled white. Adds back/title/subtitle, which mobile needs for stack navigation and web doesn't.
 * `<StatusBar style="light" />` here (not just in the root layout) overrides the theme-based default
 * for every screen that renders this bar, since the accent bg needs light icons in both app themes.
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
  const cartActive = pathname === '/cart'
  const profileActive = pathname === '/profile'

  return (
    <View className="flex-row items-center gap-2 border-b border-white/20 bg-accent px-4 py-3">
      <StatusBar style="light" />
      {showBack && (
        <Pressable
          accessibilityLabel="Go back"
          accessibilityRole="button"
          className="-ml-1 size-9 items-center justify-center rounded-full active:bg-white/15"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        >
          <Ionicons color="#ffffff" name="chevron-back" size={22} />
        </Pressable>
      )}
      <View className="min-w-0 flex-1">
        <Text className="text-lg font-bold text-white" numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text className="text-xs text-white/70" numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {action}
      {showSearch && pathname !== '/search' && (
        <Pressable
          accessibilityLabel="Search"
          accessibilityRole="button"
          className="size-9 items-center justify-center rounded-full border border-white/25 bg-white/10 active:bg-white/20"
          onPress={() => router.push('/search')}
        >
          <Ionicons color="#ffffff" name="search" size={18} />
        </Pressable>
      )}
      {showCart && (
        <Pressable
          accessibilityLabel={cart.count ? `Cart, ${cart.count} items` : 'Cart'}
          accessibilityRole="button"
          className={`size-9 items-center justify-center rounded-full ${cartActive ? 'bg-white' : 'active:bg-white/15'}`}
          onPress={() => router.push('/cart')}
        >
          <Ionicons color={cartActive ? colors.accent : '#ffffff'} name="bag-outline" size={20} />
          {cart.count > 0 && (
            <View className="absolute -right-1 -top-1 min-w-4 items-center justify-center rounded-full border-2 border-accent bg-accent-light px-1">
              <Text className="text-[10px] font-black leading-4 text-accent">{cart.count > 99 ? '99+' : cart.count}</Text>
            </View>
          )}
        </Pressable>
      )}
      {showProfile && (
        <Pressable
          accessibilityLabel={user ? 'Your profile' : 'Sign in'}
          accessibilityRole="button"
          className={`size-9 items-center justify-center rounded-full border border-white/25 ${profileActive ? 'bg-white' : 'bg-white/10 active:bg-white/20'}`}
          onPress={() => router.push(user ? '/profile' : '/login')}
        >
          {user ? (
            <Avatar name={user.name} size={26} uri={user.profilePhoto} />
          ) : (
            <Ionicons color="#ffffff" name="person-circle-outline" size={22} />
          )}
        </Pressable>
      )}
    </View>
  )
}
