import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { Text, View, type ColorValue } from 'react-native'
import { useMessaging } from '../../hooks/useMessaging'
import { useThemeColors } from '../../hooks/useThemeColors'

function InboxIcon({ color, focused, size }: { color: ColorValue; focused: boolean; size: number }) {
  const { unreadMessageCount, unreadNotificationCount } = useMessaging()
  const hasSystemDot = unreadMessageCount === 0 && unreadNotificationCount > 0
  // Mirrors the web BottomTabs badge: white ring always, but the fill inverts to white when the
  // tab itself is the active accent-colored pill so the badge stays legible against it.
  const fillClass = focused ? 'bg-white' : 'bg-accent-strong'
  const textClass = focused ? 'text-accent-strong' : 'text-white'

  return (
    <View>
      <Ionicons color={color} name="mail-outline" size={size} />
      {unreadMessageCount > 0 ? (
        <View
          className={`absolute -right-2.5 -top-1 min-w-4 items-center justify-center rounded-full border-2 border-white px-1 ${fillClass}`}
        >
          <Text className={`text-[10px] font-black leading-4 ${textClass}`}>
            {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
          </Text>
        </View>
      ) : (
        hasSystemDot && (
          <View className={`absolute -right-1 -top-0.5 size-2.5 rounded-full border-2 border-white ${fillClass}`} />
        )
      )}
    </View>
  )
}

/**
 * Same five destinations as the web app's `BottomTabs`, styled to match: active tab gets a solid
 * accent pill with white icon+label (`tabBarActiveBackgroundColor`/`tabBarActiveTintColor`) rather
 * than just a tint-color change, same as `frontend/src/components/layout/BottomTabs.tsx`.
 */
export default function TabsLayout() {
  const colors = useThemeColors()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveBackgroundColor: colors.accent,
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: colors.faint,
        tabBarItemStyle: { borderRadius: 8, marginHorizontal: 4, marginVertical: 4 },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="storefront-outline" size={size} />,
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="bag-handle-outline" size={size} />,
          title: 'Browse',
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="grid-outline" size={size} />,
          title: 'Community',
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons color={color} name="heart-outline" size={size} />,
          title: 'Saved',
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          tabBarIcon: ({ color, focused, size }) => <InboxIcon color={color} focused={focused} size={size} />,
          title: 'Inbox',
        }}
      />
    </Tabs>
  )
}
