import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { Text, View, type ColorValue } from 'react-native'
import { useMessaging } from '../../hooks/useMessaging'
import { useThemeColors } from '../../hooks/useThemeColors'

function InboxIcon({ color, size }: { color: ColorValue; size: number }) {
  const { unreadMessageCount, unreadNotificationCount } = useMessaging()
  const hasSystemDot = unreadMessageCount === 0 && unreadNotificationCount > 0

  return (
    <View>
      <Ionicons color={color} name="mail-outline" size={size} />
      {unreadMessageCount > 0 ? (
        <View className="absolute -right-2.5 -top-1 min-w-4 items-center justify-center rounded-full bg-accent-strong px-1">
          <Text className="text-[10px] font-black leading-4 text-white">
            {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
          </Text>
        </View>
      ) : (
        hasSystemDot && <View className="absolute -right-1 -top-0.5 size-2.5 rounded-full bg-accent-strong" />
      )}
    </View>
  )
}

/** Same five destinations as the web app's `BottomTabs`. */
export default function TabsLayout() {
  const colors = useThemeColors()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.faint,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
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
          tabBarIcon: ({ color, size }) => <InboxIcon color={color} size={size} />,
          title: 'Inbox',
        }}
      />
    </Tabs>
  )
}
